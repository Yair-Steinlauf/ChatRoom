"use strict";

const REGISTER_TIMEOUT = 30;

// ============================================================
// Model - data layer, no DOM access
// ============================================================
const AppModel = {
  currentView: 'login',
  timerInterval: null,
  timeRemaining: REGISTER_TIMEOUT,
  registrationSuccess: false
};

// ============================================================
// View - DOM rendering, no data fetching
// ============================================================
const AppView = {
  /**
   * Get view name from URL hash
   * @returns {string} View name
   */
  getViewFromHash() {
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
   * Render a view template
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

    // Clone and render template
    const content = template.content.cloneNode(true);
    app.innerHTML = '';
    app.appendChild(content);

    // Update history
    if (pushState) {
      const url = viewName === 'login' ? '/' : `/#${viewName}`;
      window.history.pushState({ view: viewName }, '', url);
    }
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
  },

  /**
   * Display user info in Step 2
   * @param {HTMLElement} userInfo - User info display element
   * @param {Object} data - User data object
   */
  displayUserInfo(userInfo, data) {
    userInfo.innerHTML = `
      <strong>Email:</strong> ${data.email}<br>
      <strong>Name:</strong> ${data.firstName} ${data.lastName}
    `;
  },

  /**
   * Update timer display
   * @param {HTMLElement} timerDisplay - Timer display element
   * @param {number} seconds - Seconds remaining
   */
  updateTimerDisplay(timerDisplay, seconds) {
    timerDisplay.textContent = seconds;
  },

  /**
   * Show timeout warning
   * @param {HTMLElement} timeoutWarning - Timeout warning element
   */
  showTimeoutWarning(timeoutWarning) {
    timeoutWarning.classList.remove('d-none');
  },

  /**
   * Change timer to danger state
   * @param {HTMLElement} timeoutWarning - Timeout warning element
   */
  setTimerDanger(timeoutWarning) {
    timeoutWarning.classList.remove('alert-warning');
    timeoutWarning.classList.add('alert-danger');
  },

  /**
   * Populate registration inputs
   * @param {HTMLElement} emailInput - Email input
   * @param {HTMLElement} firstNameInput - First name input
   * @param {HTMLElement} lastNameInput - Last name input
   * @param {Object} data - Data object
   */
  populateRegistrationInputs(emailInput, firstNameInput, lastNameInput, data) {
    emailInput.value = data.email || '';
    firstNameInput.value = data.firstName || '';
    lastNameInput.value = data.lastName || '';
  }
};

// ============================================================
// Controller - logic, fetching, event handling
// ============================================================
const AppController = {
  /**
   * Initialize the application
   */
  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const view = e.state?.view || 'login';
      this.navigateToView(view, false);
    });

    // Initial view based on URL hash or default to login
    const initialView = AppView.getViewFromHash();
    this.navigateToView(initialView, true);
  },

  /**
   * Navigate to a specific view
   * @param {string} viewName - Name of the view
   * @param {boolean} pushState - Whether to push to history
   */
  navigateToView(viewName, pushState = true) {
    // Clear timer if exists
    if (AppModel.timerInterval) {
      clearInterval(AppModel.timerInterval);
      AppModel.timerInterval = null;
    }

    // Update model and view
    AppModel.currentView = viewName;
    AppView.renderView(viewName, pushState);

    // Initialize view-specific logic
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
    if (AppModel.registrationSuccess) {
      AppView.showMessage(messageContainer, 'You are now registered! Please log in.', 'success');
      AppModel.registrationSuccess = false;
    }

    // Handle register link
    goToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateToView('register-step1');
    });

    // Handle form submission - Login
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // Clear previous messages
      AppView.showMessage(messageContainer, '', 'info');
      messageContainer.classList.add('d-none');

      // Basic validation
      if (!email || !password) {
        AppView.showMessage(messageContainer, 'Email and password are required', 'danger');
        return;
      }

      await this.handleLogin(email, password, messageContainer);
    });
  },

  /**
   * Handle login submission
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {HTMLElement} messageContainer - Message container element
   */
  async handleLogin(email, password, messageContainer) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = '/chatroom';
      } else {
        AppView.showMessage(messageContainer, result.error || 'Login failed', 'danger');
      }
    } catch (error) {
      AppView.showMessage(messageContainer, 'Network error. Please try again.', 'danger');
      console.error('Login error:', error);
    }
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
      this.navigateToView('login');
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        email: emailInput.value.trim(),
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim()
      };

      await this.handleRegisterStep1(formData, errorContainer);
    });
  },

  /**
   * Load existing registration data from server
   * @param {HTMLElement} emailInput - Email input
   * @param {HTMLElement} firstNameInput - First name input
   * @param {HTMLElement} lastNameInput - Last name input
   */
  async loadExistingRegistrationData(emailInput, firstNameInput, lastNameInput) {
    try {
      const response = await fetch('/api/auth/register/step1');
      const result = await response.json();

      if (result.success && result.data) {
        AppView.populateRegistrationInputs(emailInput, firstNameInput, lastNameInput, result.data);
      }
    } catch (error) {
      console.error('Error loading registration data:', error);
    }
  },

  /**
   * Handle registration step 1 submission
   * @param {Object} formData - Form data object
   * @param {HTMLElement} errorContainer - Error container element
   */
  async handleRegisterStep1(formData, errorContainer) {
    try {
      const response = await fetch('/api/auth/register/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        this.navigateToView('register-step2');
      } else {
        AppView.showMessage(errorContainer, result.error || 'An error occurred', 'danger');
      }
    } catch (error) {
      AppView.showMessage(errorContainer, 'Network error. Please try again.', 'danger');
      console.error('Registration error:', error);
    }
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
      if (AppModel.timerInterval) {
        clearInterval(AppModel.timerInterval);
      }
      this.navigateToView('register-step1');
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = passwordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      // Client-side validation
      if (password !== confirmPassword) {
        AppView.showMessage(errorContainer, 'Passwords do not match', 'danger');
        return;
      }

      await this.handleRegisterStep2(password, confirmPassword, errorContainer);
    });
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
        this.navigateToView('register-step1');
        return;
      }

      // Display user info
      if (result.data) {
        AppView.displayUserInfo(userInfo, result.data);
        this.startTimer(timerDisplay, timeoutWarning);
      }
    } catch (error) {
      console.error('Error loading registration session:', error);
      this.navigateToView('register-step1');
    }
  },

  /**
   * Handle registration step 2 submission
   * @param {string} password - Password
   * @param {string} confirmPassword - Confirm password
   * @param {HTMLElement} errorContainer - Error container element
   */
  async handleRegisterStep2(password, confirmPassword, errorContainer) {
    try {
      const response = await fetch('/api/auth/register/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword })
      });

      const result = await response.json();

      if (result.success) {
        if (AppModel.timerInterval) {
          clearInterval(AppModel.timerInterval);
        }
        AppModel.registrationSuccess = true;
        this.navigateToView('login');
      } else {
        if (result.expired) {
          if (AppModel.timerInterval) {
            clearInterval(AppModel.timerInterval);
          }
          alert('Registration session expired. Please start over.');
          this.navigateToView('register-step1');
        } else {
          AppView.showMessage(errorContainer, result.error || 'An error occurred', 'danger');
        }
      }
    } catch (error) {
      AppView.showMessage(errorContainer, 'Network error. Please try again.', 'danger');
      console.error('Registration error:', error);
    }
  },

  /**
   * Start countdown timer
   * @param {HTMLElement} timerDisplay - Timer display element
   * @param {HTMLElement} timeoutWarning - Timeout warning element
   */
  startTimer(timerDisplay, timeoutWarning) {
    AppModel.timeRemaining = REGISTER_TIMEOUT;
    AppView.showTimeoutWarning(timeoutWarning);

    AppModel.timerInterval = setInterval(() => {
      AppModel.timeRemaining--;
      AppView.updateTimerDisplay(timerDisplay, AppModel.timeRemaining);

      // Change to danger alert at 10s
      if (AppModel.timeRemaining <= 10) {
        AppView.setTimerDanger(timeoutWarning);
      }

      if (AppModel.timeRemaining <= 0) {
        clearInterval(AppModel.timerInterval);
        alert('Registration session expired. Please start over.');
        this.navigateToView('register-step1');
      }
    }, 1000);
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});
