"use strict";

const POLLING = 10000; // 10 seconds

// ============================================================
// Model - data layer, no DOM access
// ============================================================
const ChatModel = {
  lastUpdateTime: null,
  currentUser: null,
  messages: [],
  editingMessageId: null,
  isSearchMode: false,
  searchQuery: null,

  /**
   * Find a message by its id
   * @param {number} id - message id
   * @returns {Object|undefined} the message object or undefined
   */
  findMessage(id) {
    return this.messages.find(m => m.id === id);
  },

  /**
   * Check if the given message belongs to the current user
   * @param {Object} msg - message object
   * @returns {boolean}
   */
  isOwner(msg) {
    return msg.user.id === this.currentUser?.id;
  }
};

// ============================================================
// View - DOM rendering, no data fetching
// ============================================================
const ChatView = {
  // Cached DOM elements
  elements: {},

  /**
   * Cache all fixed DOM elements once
   */
  cacheElements() {
    this.elements = {
      messagesContainer: document.getElementById('messages-container'),
      messageForm: document.getElementById('message-form'),
      messageInput: document.getElementById('message-input'),
      logoutBtn: document.getElementById('logout-btn'),
      searchInput: document.getElementById('search-input'),
      searchBtn: document.getElementById('search-btn'),
      clearSearchBtn: document.getElementById('clear-search-btn'),
      editContainer: document.getElementById('edit-container'),
      editContent: document.getElementById('edit-content'),
      saveEditBtn: document.getElementById('save-edit-btn'),
      cancelEditBtn: document.getElementById('cancel-edit-btn'),
      flashContainer: document.getElementById('flash-container'),
      username: document.getElementById('username')
    };
  },

  /**
   * Display the current user name
   * @param {string} name - first name
   */
  setUsername(name) {
    this.elements.username.textContent = name;
  },

  /**
   * Render messages list into the container
   * @param {Array} messages - array of message objects
   * @param {number|null} currentUserId - id of the logged-in user
   */
  renderMessages(messages, currentUserId) {
    const container = this.elements.messagesContainer;
    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No messages yet. Be the first to send one!</p>';
      return;
    }

    // Build all elements offline using DocumentFragment
    const fragment = document.createDocumentFragment();

    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'message-item';
      // Use dataset instead of id attribute
      div.dataset.messageId = msg.id;

      const isOwner = msg.user.id === currentUserId;

      div.innerHTML = `
        <div class="message-header">
          <span class="message-author">${this.escapeHtml(msg.user.firstName)} ${this.escapeHtml(msg.user.lastName)}</span>
          <span class="message-time">${this.formatDate(msg.createdAt)}${msg.updatedAt !== msg.createdAt ? ' (edited)' : ''}</span>
        </div>
        <div class="message-content">
          ${this.escapeHtml(msg.content)}
        </div>
        ${isOwner ? `
          <div class="message-actions">
            <button class="btn btn-sm btn-warning edit-btn" data-id="${msg.id}" type="button">Edit</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${msg.id}" type="button">Delete</button>
          </div>
        ` : ''}
      `;
      fragment.appendChild(div);
    });

    // Insert all at once
    container.appendChild(fragment);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  },

  /**
   * Show the edit form with the given content
   * @param {string} content - message content to edit
   */
  showEditForm(content) {
    this.elements.editContent.value = content;
    this.elements.editContainer.classList.add('active');
    this.elements.editContainer.scrollIntoView({ behavior: 'smooth' });
  },

  /**
   * Hide the edit form and clear its content
   */
  hideEditForm() {
    this.elements.editContainer.classList.remove('active');
    this.elements.editContent.value = '';
  },

  /**
   * Get the current edit textarea value
   * @returns {string} trimmed content
   */
  getEditContent() {
    return this.elements.editContent.value.trim();
  },

  /**
   * Show/hide the clear search button
   * @param {boolean} visible
   */
  setClearSearchVisible(visible) {
    this.elements.clearSearchBtn.style.display = visible ? 'block' : 'none';
  },

  /**
   * Get the search input value
   * @returns {string} trimmed query
   */
  getSearchQuery() {
    return this.elements.searchInput.value.trim();
  },

  /**
   * Clear the search input
   */
  clearSearchInput() {
    this.elements.searchInput.value = '';
  },

  /**
   * Show a flash message
   * @param {string} message - text to display
   * @param {string} type - alert type (success, info, danger, warning)
   */
  showFlash(message, type) {
    const el = this.elements.flashContainer;
    if (!el) return;
    el.classList.remove('d-none', 'alert-info', 'alert-success', 'alert-danger', 'alert-warning');
    el.classList.add(`alert-${type}`);
    el.textContent = message;
  },

  /**
   * Show an error in the messages container
   * @param {string} text - error message
   */
  showContainerError(text) {
    this.elements.messagesContainer.innerHTML = `<p class="text-center text-danger">${this.escapeHtml(text)}</p>`;
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - raw text
   * @returns {string} escaped html
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Format a date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} formatted date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// ============================================================
// Controller - logic, fetching, event handling
// ============================================================
const ChatController = {
  /**
   * Initialize the chatroom
   */
  async init() {
    ChatView.cacheElements();

    await this.loadCurrentUser();
    this.showFlashMessageFromQuery();

    if (!ChatModel.currentUser) {
      return;
    }

    await this.loadMessages();
    this.setupEventListeners();
    this.startPolling();
  },

  /**
   * Fetch current user from server
   */
  async loadCurrentUser() {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();

      if (result.success) {
        ChatModel.currentUser = result.user;
        ChatView.setUsername(result.user.firstName);
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      window.location.href = '/';
    }
  },

  /**
   * Fetch messages from server and render them
   */
  async loadMessages() {
    try {
      const url = ChatModel.isSearchMode
        ? `/api/messages/search?q=${encodeURIComponent(ChatModel.searchQuery)}`
        : '/api/messages';

      const response = await fetch(url);

      if (response.status === 401) {
        window.location.href = '/';
        return;
      }

      const result = await response.json();

      if (result.success) {
        // Store messages in model
        ChatModel.messages = result.messages;
        ChatView.renderMessages(result.messages, ChatModel.currentUser?.id);
        if (result.lastUpdateAt) {
          ChatModel.lastUpdateTime = new Date(result.lastUpdateAt).getTime();
        }
      } else {
        ChatView.showFlash(result.error || 'Failed to load messages', 'danger');
        ChatView.showContainerError('Failed to load messages.');
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      ChatView.showFlash('Failed to load messages (check server/API).', 'danger');
      ChatView.showContainerError('Failed to load messages.');
    }
  },

  /**
   * Attach all event listeners using delegation where appropriate
   */
  setupEventListeners() {
    const el = ChatView.elements;

    // Send message - regular form submit, only validate client-side
    el.messageForm.addEventListener('submit', (e) => {
      const content = el.messageInput.value.trim();
      if (!content) {
        e.preventDefault();
        ChatView.showFlash('Message content cannot be empty', 'danger');
      }
    });

    // Logout
    el.logoutBtn.addEventListener('click', () => this.logout());

    // Search
    el.searchBtn.addEventListener('click', () => this.searchMessages());
    el.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchMessages();
      }
    });
    el.clearSearchBtn.addEventListener('click', () => this.clearSearch());

    // Edit save / cancel
    el.saveEditBtn.addEventListener('click', () => this.saveEdit());
    el.cancelEditBtn.addEventListener('click', () => this.cancelEdit());

    // Delegation on messages container for edit and delete buttons
    el.messagesContainer.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('delete-btn')) {
        const messageId = parseInt(target.dataset.id);
        window.location.href = `/messages/${messageId}/delete`;
      } else if (target.classList.contains('edit-btn')) {
        const messageId = parseInt(target.dataset.id);
        this.startEdit(messageId);
      }
    });
  },

  /**
   * Start editing a message - read content from model data
   * @param {number} messageId
   */
  startEdit(messageId) {
    // Get content from model data
    const msg = ChatModel.findMessage(messageId);
    if (!msg) return;

    ChatModel.editingMessageId = messageId;
    ChatView.showEditForm(msg.content);
  },

  /**
   * Cancel editing
   */
  cancelEdit() {
    ChatModel.editingMessageId = null;
    ChatView.hideEditForm();
  },

  /**
   * Save the edited message
   */
  async saveEdit() {
    const messageId = ChatModel.editingMessageId;
    const content = ChatView.getEditContent();

    if (!content) {
      alert('Message content cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.status === 401) {
        window.location.href = '/';
        return;
      }

      const result = await response.json();

      if (result.success) {
        this.cancelEdit();
        await this.loadMessages();
      } else {
        alert(result.error || 'Failed to update message');
      }
    } catch (error) {
      console.error('Failed to update message:', error);
      alert('Network error. Please try again.');
    }
  },

  /**
   * Perform a search
   */
  async searchMessages() {
    const query = ChatView.getSearchQuery();
    if (!query) return;

    ChatModel.isSearchMode = true;
    ChatModel.searchQuery = query;
    ChatView.setClearSearchVisible(true);

    // Stop polling during search
    if (ChatModel.pollInterval) {
      clearInterval(ChatModel.pollInterval);
      ChatModel.pollInterval = null;
    }

    await this.loadMessages();
  },

  /**
   * Clear search and resume normal view
   */
  async clearSearch() {
    ChatModel.isSearchMode = false;
    ChatModel.searchQuery = null;
    ChatView.clearSearchInput();
    ChatView.setClearSearchVisible(false);

    this.startPolling();
    await this.loadMessages();
  },

  /**
   * Start polling for updates
   */
  startPolling() {
    if (ChatModel.pollInterval) {
      clearInterval(ChatModel.pollInterval);
    }

    ChatModel.pollInterval = setInterval(async () => {
      if (!ChatModel.editingMessageId) {
        await this.pollOnce();
      }
    }, POLLING);
  },

  /**
   * Single poll cycle
   */
  async pollOnce() {
    if (ChatModel.isSearchMode) return;

    const hasUpdates = await this.hasServerUpdates();
    if (hasUpdates) {
      await this.loadMessages();
    }
  },

  /**
   * Check if server has newer data than our local timestamp
   * @returns {Promise<boolean>}
   */
  async hasServerUpdates() {
    try {
      const response = await fetch('/api/messages/last-update');

      if (response.status === 401) {
        window.location.href = '/';
        return false;
      }

      const result = await response.json();
      if (!result.success || !result.lastUpdateAt) {
        return false;
      }

      const serverTime = new Date(result.lastUpdateAt).getTime();

      if (!ChatModel.lastUpdateTime) {
        return true;
      }

      return serverTime > ChatModel.lastUpdateTime;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  },

  /**
   * Log the user out
   */
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });

      if (ChatModel.pollInterval) {
        clearInterval(ChatModel.pollInterval);
      }

      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  },

  /**
   * Show flash message from URL query params (after form redirect)
   */
  showFlashMessageFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const status = params.get('status');

    if (error) {
      ChatView.showFlash(decodeURIComponent(error), 'danger');
    } else if (status) {
      const messages = {
        created: 'Message sent successfully',
        deleted: 'Message deleted successfully'
      };
      const msg = messages[status] || null;
      if (msg) {
        ChatView.showFlash(msg, 'success');
      }
    }

    if (error || status) {
      window.history.replaceState({}, document.title, '/chatroom');
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ChatController.init();
});
