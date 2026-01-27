"use strict";

const REGISTER_TIMEOUT = 30;

/**
 * SPA Application
 */
const App = {
  // Application state
  state: {
    currentView: 'login',
    timerInterval: null,
    timeRemaining: REGISTER_TIMEOUT,
    registrationSuccess: false
  },

  /**
   * Initialize the application
   */
  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const view = e.state?.view || 'login';
      this.renderView(view, false);
    });

    // Initial view based on URL hash or default to login
    const initialView = this.getViewFromHash();
    this.renderView(initialView, true);
  },

  /**
   * Get view name from URL hash
   * @returns {string} View name
   */
  getViewFromHash() {
    // Support /register path as well as hash-based navigation
    if (window.location.pathname === '/register') {
      return 'register-step1';
    }
    const hash = window.location.hash.slice(1);
    if (hash === 'register-step1' || hash === 'register-step2') {
      return hash;
    }
    return 'login';
  },

  /**
   * Render a view
   * @param {string} viewName - Name of the view to render
   * @param {boolean} pushState - Whether to push to history
   */
  renderView(viewName, pushState = true) {
    const app = document.getElementById('app');
    const template = document.getElementById(`${viewName}-view`);

    if (!template) {
      console.error(`Template ${viewName}-view not found`);
      return;
    }

    // Clear timer if exists
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }

    // Clone and render template
    const content = template.content.cloneNode(true);
    app.innerHTML = '';
    app.appendChild(content);

    // Update state
    this.state.currentView = viewName;

    // Update history
    if (pushState) {
      const url = viewName === 'login' ? '/' : `/#${viewName}`;
      window.history.pushState({ view: viewName }, '', url);
    }

    // Initialize view
    this.initView(viewName);
  },

  /**
   * Initialize view-specific logic
   * @param {string} viewName - Name of the view
   */
  initView(viewName) {
    switch (viewName) {
      case 'login':
        this.initLoginView();
        break;
      case 'register-step1':
        this.initRegisterStep1View();
        break;
      case 'register-step2':
        this.initRegisterStep2View();
        break;
    }
  },

  /**
   * Initialize login view
   */
  initLoginView() {
    const form = document.getElementById('login-form');
    const goToRegister = document.getElementById('go-to-register');
    const messageContainer = document.getElementById('message-container');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    // Check for registration success from state
    if (this.state.registrationSuccess) {
      this.showMessage(messageContainer, 'You are now registered! Please log in.', 'success');
      this.state.registrationSuccess = false;
    }

    // Handle register link
    goToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      this.renderView('register-step1');
    });

    // Handle form submission - Login
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // Clear previous messages
      this.showMessage(messageContainer, '', 'info');
      messageContainer.classList.add('d-none');

      // Basic validation
      if (!email || !password) {
        this.showMessage(messageContainer, 'Email and password are required', 'danger');
        return;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
          // Login הצליח - redirect ל-chatroom
          window.location.href = '/chatroom';
        } else {
          this.showMessage(messageContainer, result.error || 'Login failed', 'danger');
        }
      } catch (error) {
        this.showMessage(messageContainer, 'Network error. Please try again.', 'danger');
        console.error('Login error:', error);
      }
    });
  },

  /**
   * Initialize register step 1 view
   */
  async initRegisterStep1View() {
    const form = document.getElementById('register-step1-form');
    const goToLogin = document.getElementById('go-to-login-1');
    const errorContainer = document.getElementById('error-container');
    const emailInput = document.getElementById('reg-email');
    const firstNameInput = document.getElementById('reg-firstName');
    const lastNameInput = document.getElementById('reg-lastName');

    // Load existing data if available
    await this.loadExistingRegistrationData(emailInput, firstNameInput, lastNameInput);

    // Handle login link
    goToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      this.renderView('login');
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        email: emailInput.value.trim(),
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim()
      };

      try {
        const response = await fetch('/api/auth/register/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
          this.renderView('register-step2');
        } else {
          this.showMessage(errorContainer, result.error || 'An error occurred', 'danger');
        }
      } catch (error) {
        this.showMessage(errorContainer, 'Network error. Please try again.', 'danger');
        console.error('Registration error:', error);
      }
    });
  },

  /**
   * Initialize register step 2 view
   */
  async initRegisterStep2View() {
    const form = document.getElementById('register-step2-form');
    const backButton = document.getElementById('back-button');
    const errorContainer = document.getElementById('error-container-step2');
    const userInfo = document.getElementById('user-info');
    const timerDisplay = document.getElementById('timer');
    const timeoutWarning = document.getElementById('timeout-warning');
    const passwordInput = document.getElementById('reg-password');
    const confirmPasswordInput = document.getElementById('reg-confirmPassword');

    // Check if user can access step 2
    await this.checkStep2Access(userInfo, timerDisplay, timeoutWarning);

    // Handle back button
    backButton.addEventListener('click', () => {
      if (this.state.timerInterval) {
        clearInterval(this.state.timerInterval);
      }
      this.renderView('register-step1');
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = passwordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      // Client-side validation
      if (password !== confirmPassword) {
        this.showMessage(errorContainer, 'Passwords do not match', 'danger');
        return;
      }

      try {
        const response = await fetch('/api/auth/register/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, confirmPassword })
        });

        const result = await response.json();

        if (result.success) {
          if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
          }
          // Navigate to login with success message (SPA style)
          this.state.registrationSuccess = true;
          this.renderView('login');
        } else {
          if (result.expired) {
            if (this.state.timerInterval) {
              clearInterval(this.state.timerInterval);
            }
            alert('Registration session expired. Please start over.');
            this.renderView('register-step1');
          } else {
            this.showMessage(errorContainer, result.error || 'An error occurred', 'danger');
          }
        }
      } catch (error) {
        this.showMessage(errorContainer, 'Network error. Please try again.', 'danger');
        console.error('Registration error:', error);
      }
    });
  },

  /**
   * Load existing registration data
   * @param {HTMLElement} emailInput - Email input element
   * @param {HTMLElement} firstNameInput - First name input element
   * @param {HTMLElement} lastNameInput - Last name input element
   */
  async loadExistingRegistrationData(emailInput, firstNameInput, lastNameInput) {
    try {
      const response = await fetch('/api/auth/register/step1');
      const result = await response.json();

      if (result.success && result.data) {
        emailInput.value = result.data.email || '';
        firstNameInput.value = result.data.firstName || '';
        lastNameInput.value = result.data.lastName || '';
      }
    } catch (error) {
      console.error('Error loading registration data:', error);
    }
  },

  /**
   * Check if user can access step 2 and start timer
   * @param {HTMLElement} userInfo - User info display element
   * @param {HTMLElement} timerDisplay - Timer display element
   * @param {HTMLElement} timeoutWarning - Timeout warning element
   */
  async checkStep2Access(userInfo, timerDisplay, timeoutWarning) {
    try {
      const response = await fetch('/api/auth/register/step2');
      const result = await response.json();

      if (!result.success) {
        if (result.expired) {
          alert('Registration session expired. Please start over.');
        }
        this.renderView('register-step1');
        return;
      }

      // Display user info
      if (result.data) {
        userInfo.innerHTML = `
          <strong>Email:</strong> ${result.data.email}<br>
          <strong>Name:</strong> ${result.data.firstName} ${result.data.lastName}
        `;

        // Start countdown timer
        this.startTimer(timerDisplay, timeoutWarning);
      }
    } catch (error) {
      console.error('Error loading registration session:', error);
      this.renderView('register-step1');
    }
  },

  /**
   * Start countdown timer
   * @param {HTMLElement} timerDisplay - Timer display element
   * @param {HTMLElement} timeoutWarning - Timeout warning element
   */
  startTimer(timerDisplay, timeoutWarning) {
    this.state.timeRemaining = REGISTER_TIMEOUT;
    timeoutWarning.classList.remove('d-none');

    this.state.timerInterval = setInterval(() => {
      this.state.timeRemaining--;
      timerDisplay.textContent = this.state.timeRemaining;

      // Change to danger alert at 10s
      if (this.state.timeRemaining <= 10) {
        timeoutWarning.classList.remove('alert-warning');
        timeoutWarning.classList.add('alert-danger');
      }

      if (this.state.timeRemaining <= 0) {
        clearInterval(this.state.timerInterval);
        alert('Registration session expired. Please start over.');
        this.renderView('register-step1');
      }
    }, 1000);
  },

  /**
   * Show message in container
   * @param {HTMLElement} container - Message container element
   * @param {string} message - Message text
   * @param {string} type - Alert type (success, info, danger, warning)
   */
  showMessage(container, message, type) {
    container.textContent = message;
    container.className = `alert alert-${type}`;
    container.classList.remove('d-none');
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
