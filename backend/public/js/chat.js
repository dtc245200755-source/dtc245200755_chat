/**
 * Internal Chat — Messenger Frontend Logic
 * Real-time messaging, Dynamic PostgreSQL synchronization, Profile management,
 * Interactive Emoji Popover, and Full Responsive Mobile Support.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------------------------------------------
  // 1. Authentication & User State
  // -----------------------------------------------------------------
  let token = window.api.getToken();
  if (!token) {
    // If not logged in, redirect to login page
    window.location.href = '/login.html';
    return;
  }

  let currentUser = window.api.getUser() || {
    id: null,
    username: '',
    displayName: 'Bạn',
    role: 'member',
    email: '',
  };

  let currentRoom = null;
  let channels = [];
  let usersList = [];
  let typingTimeout = null;

  // -----------------------------------------------------------------
  // 2. DOM Elements
  // -----------------------------------------------------------------
  const channelsContainer = document.getElementById('channels-container');
  const usersContainer = document.getElementById('users-container');
  const usersCountBadge = document.getElementById('users-count-badge');
  const sidebarSearchInput = document.getElementById('sidebar-search-input');
  const btnLogout = document.getElementById('btn-logout');
  const chatSidebar = document.getElementById('chat-sidebar');
  const btnMobileToggle = document.getElementById('btn-mobile-toggle');

  // Header Elements
  const activeChannelName = document.getElementById('active-channel-name');
  const activeChannelDesc = document.getElementById('active-channel-desc');
  const activeHashtagIcon = document.getElementById('active-hashtag-icon');
  const headerMembersText = document.getElementById('header-members-text');
  const headerAvatarStack = document.getElementById('header-avatar-stack');
  const btnRoomInfo = document.getElementById('btn-room-info');

  // Chat Feed & Input
  const messagesFeed = document.getElementById('messages-feed');
  const chatInputForm = document.getElementById('chat-input-form');
  const chatMessageInput = document.getElementById('chat-message-input');
  const typingIndicator = document.getElementById('typing-indicator');

  // Interactive Buttons
  const btnEmoji = document.getElementById('btn-emoji');
  const emojiPopover = document.getElementById('emoji-popover');
  const emojiGrid = document.getElementById('emoji-grid');
  const btnQuickHeart = document.getElementById('btn-quick-heart');
  const btnMention = document.getElementById('btn-mention');
  const btnAttach = document.getElementById('btn-attach');

  // Nav Rail Buttons
  const railBtnChat = document.getElementById('rail-btn-chat');
  const railBtnTeam = document.getElementById('rail-btn-team');
  const railBtnNotifications = document.getElementById('rail-btn-notifications');
  const railBtnSettings = document.getElementById('rail-btn-settings');
  const railProfileAvatar = document.getElementById('rail-profile-avatar');
  const railAvatarImg = document.getElementById('rail-avatar-img');

  // Footer Profile Elements
  const footerProfileBox = document.getElementById('footer-profile-box');
  const footerUserName = document.getElementById('footer-user-name');
  const footerUserAvatar = document.getElementById('footer-user-avatar');
  const btnUserSettings = document.getElementById('btn-user-settings');

  // Modal 1: Create Channel
  const createChannelModal = document.getElementById('create-channel-modal');
  const btnCreateChannel = document.getElementById('btn-create-channel');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const createChannelForm = document.getElementById('create-channel-form');
  const modalChannelName = document.getElementById('modal-channel-name');
  const modalChannelDesc = document.getElementById('modal-channel-desc');
  const modalChannelPrivate = document.getElementById('modal-channel-private');

  // Modal 2: User Profile & Change Password
  const profileModal = document.getElementById('profile-modal');
  const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
  const profileAlert = document.getElementById('profile-alert');
  const formEditProfile = document.getElementById('form-edit-profile');
  const profileDisplayName = document.getElementById('profile-display-name');
  const profileEmail = document.getElementById('profile-email');
  const modalAvatarPreview = document.getElementById('modal-avatar-preview');
  const modalUsernameDisplay = document.getElementById('modal-username-display');
  const modalRoleDisplay = document.getElementById('modal-role-display');
  const formChangePassword = document.getElementById('form-change-password');
  const profileCurrentPass = document.getElementById('profile-current-pass');
  const profileNewPass = document.getElementById('profile-new-pass');
  const profileConfirmNewPass = document.getElementById('profile-confirm-new-pass');

  // Modal 3: Members Modal
  const membersModal = document.getElementById('members-modal');
  const btnCloseMembersModal = document.getElementById('btn-close-members-modal');
  const membersModalSearch = document.getElementById('members-modal-search');
  const membersDialogList = document.getElementById('members-dialog-list');

  // Modal 4: Notifications Modal
  const notificationsModal = document.getElementById('notifications-modal');
  const btnCloseNotifModal = document.getElementById('btn-close-notif-modal');

  // Modal 5: Room Info Modal
  const roomInfoModal = document.getElementById('room-info-modal');
  const btnCloseRoomInfoModal = document.getElementById('btn-close-room-info-modal');
  const infoRoomBadge = document.getElementById('info-room-badge');
  const infoRoomName = document.getElementById('info-room-name');
  const infoRoomDesc = document.getElementById('info-room-desc');
  const infoRoomMembersList = document.getElementById('info-room-members-list');

  // Attachment File Input & Logo
  const chatFileInput = document.getElementById('chat-file-input');
  const railLogoBtn = document.getElementById('rail-logo-btn');

  // Single neutral avatar for every user (no demo-named assets).
  function getAvatarUrl() {
    return '/assets/avatars/default.svg';
  }

  // Security Helper: Escape HTML
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Format mentions (@Name) with pink interactive badge
  function formatMentions(text) {
    const escaped = escapeHTML(text);
    return escaped.replace(/@([A-Za-z0-9_\sÀ-ỹ]+?)(?=\s|$|[.,!?])/g, '<span class="chat-mention">@$1</span>');
  }

  // Format time (HH:MM)
  function formatTime(isoString) {
    if (!isoString) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  // -----------------------------------------------------------------
  // 3. Socket.IO Connection & Events
  // -----------------------------------------------------------------
  if (window.chatSocket && window.io) {
    window.chatSocket.init(window.api.getToken(), (connected) => {
      const badge = document.getElementById('connection-state-text');
      if (badge) {
        badge.textContent = connected
          ? 'Kết nối thời gian thực ổn định (WebSocket Realtime)'
          : 'Đang kết nối lại máy chủ...';
      }
    });

    // Real-time incoming messages
    window.chatSocket.onNewMessage((msg) => {
      if (currentRoom && msg.room_id === currentRoom.id) {
        // Prevent duplicate if already shown optimistically
        const existingMsg = document.getElementById(`msg-${msg.id}`);
        if (!existingMsg) {
          appendMessageRow(msg);
          scrollToBottom();
        }
      }
    });

    // Real-time typing indicators
    window.chatSocket.onUserTyping((data) => {
      if (currentRoom && data.roomId === currentRoom.id && data.username !== currentUser.username) {
        typingIndicator.textContent = data.isTyping ? `${data.displayName || data.username} đang gõ...` : '';
      }
    });
  }

  // -----------------------------------------------------------------
  // 4. UI Profile Update & Sync
  // -----------------------------------------------------------------
  function updateProfileUI() {
    if (currentUser) {
      const name = currentUser.displayName || currentUser.username || 'Bạn';
      footerUserName.textContent = name;
      const avatarSrc = getAvatarUrl(currentUser.username);
      footerUserAvatar.src = avatarSrc;
      railAvatarImg.src = avatarSrc;
      modalAvatarPreview.src = avatarSrc;
      modalUsernameDisplay.textContent = `@${currentUser.username}`;
      modalRoleDisplay.textContent = currentUser.role === 'admin' ? 'Quản Trị Viên 💼' : 'Thành Viên';
      profileDisplayName.value = currentUser.displayName || currentUser.username || '';
      profileEmail.value = currentUser.email || '';
    }
  }

  // -----------------------------------------------------------------
  // 5. Channels & Users Rendering
  // -----------------------------------------------------------------
  function renderChannels(filter = '') {
    channelsContainer.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const filtered = channels.filter((c) => (c.name || '').toLowerCase().includes(q));

    if (filtered.length === 0) {
      channelsContainer.innerHTML = '<div style="font-size: 12px; color: var(--rose); padding: 8px 12px;">Không tìm thấy phòng phù hợp.</div>';
      return;
    }

    filtered.forEach((ch) => {
      const isActive = currentRoom && currentRoom.id === ch.id;
      const item = document.createElement('div');
      item.className = `channel-item ${isActive ? 'active' : ''}`;
      item.id = `channel-item-${ch.id}`;
      item.innerHTML = `
        <span class="channel-hash">${ch.is_private ? '🔒' : '#'}</span>
        <span class="channel-name">${escapeHTML(ch.name)}</span>
      `;

      item.addEventListener('click', () => {
        switchChannel(ch);
        if (window.innerWidth <= 768) {
          chatSidebar.classList.remove('mobile-open');
        }
      });
      channelsContainer.appendChild(item);
    });
  }

  function renderUsers(filter = '') {
    usersContainer.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const filtered = usersList.filter((u) => {
      const name = u.displayName || u.display_name || u.username || '';
      return name.toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
    });

    if (usersCountBadge) {
      usersCountBadge.textContent = `(${filtered.length})`;
    }

    if (filtered.length === 0) {
      usersContainer.innerHTML = '<div style="font-size: 12px; color: var(--rose); padding: 8px 10px;">Chưa có thành viên nào.</div>';
      return;
    }

    filtered.forEach((u) => {
      const item = document.createElement('div');
      item.className = 'user-item';
      const displayName = u.displayName || u.display_name || u.username;
      const isSelf = currentUser && (u.id === currentUser.id || u.username === currentUser.username);
      item.title = `Nhắc tên ${displayName} (@${u.username})`;

      const avatarSrc = getAvatarUrl(u.username);
      const isOnline = true; // Connected users or active DB members

      item.innerHTML = `
        <div class="user-item-left">
          <div class="user-item-avatar-box">
            <img src="${avatarSrc}" alt="${escapeHTML(displayName)}" class="user-item-avatar">
          </div>
          <span class="user-item-name">
            ${escapeHTML(displayName)}
            ${isSelf ? '<span class="user-item-tag status-online-text">(Bạn)</span>' : ''}
          </span>
        </div>
        <span class="user-status-indicator dot-online" title="Trực tuyến"></span>
      `;

      // Clicking user inserts @mention into input field
      item.addEventListener('click', () => {
        chatMessageInput.value += `@${u.username} `;
        chatMessageInput.focus();
        if (window.innerWidth <= 768) {
          chatSidebar.classList.remove('mobile-open');
        }
      });

      usersContainer.appendChild(item);
    });
  }

  // Reload the full user directory from the API and re-render the sidebar.
  async function reloadUsersList() {
    try {
      const res = await window.api.users.list();
      if (res && res.data && res.data.users) {
        usersList = res.data.users;
      }
    } catch (err) {
      console.warn('Could not reload users list:', err);
    }
    renderUsers(sidebarSearchInput ? sidebarSearchInput.value : '');
  }

  // -----------------------------------------------------------------
  // 6. Switch Channel & Load Messages
  // -----------------------------------------------------------------
  async function switchChannel(channel) {
    if (currentRoom && currentRoom.id === channel.id) return;

    if (currentRoom && window.chatSocket) {
      window.chatSocket.leaveRoom(currentRoom.id);
    }

    currentRoom = channel;

    // Update Header
    activeChannelName.textContent = channel.name;
    activeChannelDesc.textContent = channel.description || 'Mọi người cùng trò chuyện công việc tại đây';
    activeHashtagIcon.textContent = channel.is_private ? '🔒' : '#';

    // Highlight in sidebar
    renderChannels(sidebarSearchInput.value);

    // Join room in Socket
    if (window.chatSocket) {
      window.chatSocket.joinRoom(channel.id);
    }

    // Load messages from PostgreSQL
    messagesFeed.innerHTML = '<div style="margin: auto; color: var(--primary-pink); font-size: 13px;">Đang tải tin nhắn...</div>';
    await loadChannelMessages(channel.id);
    chatMessageInput.focus();

    // Update members stack
    loadChannelMembers(channel.id);
  }

  async function loadChannelMembers(channelId) {
    try {
      const res = await window.api.rooms.members(channelId);
      const members = res.data.members || [];
      headerAvatarStack.innerHTML = '';

      members.slice(0, 4).forEach((m) => {
        const img = document.createElement('img');
        img.className = 'stack-avatar';
        img.src = getAvatarUrl(m.username);
        img.alt = m.displayName || m.username;
        img.title = m.displayName || m.username;
        headerAvatarStack.appendChild(img);
      });

      headerMembersText.textContent = `${members.length} thành viên`;
    } catch {
      headerMembersText.textContent = 'Phòng trò chuyện';
    }
  }

  // -----------------------------------------------------------------
  // 7. Render Messages
  // -----------------------------------------------------------------
  function appendMessageRow(msg) {
    // Remove empty chat placeholder if present
    const emptyState = messagesFeed.querySelector('.empty-chat-state');
    if (emptyState) emptyState.remove();

    const isSelf = currentUser && (
      msg.user_id === currentUser.id ||
      msg.username === currentUser.username
    );

    const row = document.createElement('div');
    row.className = `msg-row ${isSelf ? 'outgoing' : 'incoming'}`;
    if (msg.id) row.id = `msg-${msg.id}`;

    const senderName = isSelf ? (currentUser.displayName || currentUser.username || 'Bạn') : (msg.displayName || msg.username || 'Thành viên');
    const avatarSrc = getAvatarUrl(msg.username || senderName);
    const timeFormatted = formatTime(msg.created_at);
    const contentHTML = formatMentions(msg.content);

    if (isSelf) {
      row.innerHTML = `
        <div class="msg-body">
          <div class="msg-meta">
            <span class="msg-sender-name">${escapeHTML(senderName)}</span>
            <span class="msg-time">${timeFormatted}</span>
          </div>
          <div class="msg-bubble">${contentHTML}</div>
        </div>
      `;
    } else {
      row.innerHTML = `
        <img src="${avatarSrc}" alt="${escapeHTML(senderName)}" class="msg-avatar">
        <div class="msg-body">
          <div class="msg-meta">
            <span class="msg-sender-name">${escapeHTML(senderName)}</span>
            <span class="msg-time">${timeFormatted}</span>
          </div>
          <div class="msg-bubble">${contentHTML}</div>
        </div>
      `;
    }

    messagesFeed.appendChild(row);
  }

  function renderEmptyChatState() {
    messagesFeed.innerHTML = `
      <div class="empty-chat-state">
        <div class="empty-chat-icon">💌</div>
        <div class="empty-chat-title">Chưa có tin nhắn nào ở đây!</div>
        <div class="empty-chat-desc">Hãy là người đầu tiên gửi tin nhắn đến phòng này nhé</div>
      </div>
    `;
  }

  function scrollToBottom() {
    messagesFeed.scrollTop = messagesFeed.scrollHeight;
  }

  async function loadChannelMessages(channelId) {
    try {
      const res = await window.api.messages.list(channelId);
      const msgs = res.data.messages || [];
      messagesFeed.innerHTML = '';

      if (msgs.length > 0) {
        msgs.forEach((m) => appendMessageRow(m));
      } else {
        renderEmptyChatState();
      }
    } catch (err) {
      renderEmptyChatState();
    }
    scrollToBottom();
  }

  // -----------------------------------------------------------------
  // 8. Sending Messages
  // -----------------------------------------------------------------
  chatInputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = chatMessageInput.value.trim();
    if (!content || !currentRoom) return;

    chatMessageInput.value = '';

    // If socket is connected, broadcast via Socket.IO
    if (window.chatSocket && window.chatSocket.socket && window.chatSocket.socket.connected) {
      window.chatSocket.sendMessage(currentRoom.id, content, (ack) => {
        if (ack && ack.success && ack.message) {
          const existing = document.getElementById(`msg-${ack.message.id}`);
          if (!existing) {
            appendMessageRow(ack.message);
            scrollToBottom();
          }
        }
      });
    } else {
      // REST API fallback
      try {
        const res = await window.api.messages.send(currentRoom.id, content);
        if (res && res.data && res.data.message) {
          appendMessageRow(res.data.message);
          scrollToBottom();
        }
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  });

  // Typing indicator trigger
  chatMessageInput.addEventListener('input', () => {
    if (!currentRoom || !window.chatSocket) return;
    window.chatSocket.startTyping(currentRoom.id);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      window.chatSocket.stopTyping(currentRoom.id);
    }, 1500);
  });

  // -----------------------------------------------------------------
  // 9. Interactive Emoji Popover & Quick Reaction
  // -----------------------------------------------------------------
  const chatEmojis = [
    '👍', '👏', '🙏', '✅', '💡', '🔥',
    '🎉', '⭐', '😊', '😂', '🤔', '👀',
    '💬', '📌', '📎', '🎯', '🙌', '✨',
    '💯', '😄', '🙂', '🤝', '📝', '👌'
  ];

  if (emojiGrid) {
    chatEmojis.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatMessageInput.value += `${emoji} `;
        chatMessageInput.focus();
        emojiPopover.classList.remove('active');
      });
      emojiGrid.appendChild(btn);
    });
  }

  btnEmoji.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPopover.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!emojiPopover.contains(e.target) && e.target !== btnEmoji) {
      emojiPopover.classList.remove('active');
    }
  });

  // Quick Reaction Button
  btnQuickHeart.addEventListener('click', () => {
    chatMessageInput.value += '👍 ';
    chatMessageInput.focus();
  });

  // Mention Button
  btnMention.addEventListener('click', () => {
    chatMessageInput.value += '@';
    chatMessageInput.focus();
  });

  // Attachment Button
  if (btnAttach && chatFileInput) {
    btnAttach.addEventListener('click', () => {
      chatFileInput.click();
    });

    chatFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const filePrefix = file.type.startsWith('image/') ? '🖼️ [Hình ảnh' : '📎 [Tệp';
        chatMessageInput.value = (chatMessageInput.value ? chatMessageInput.value + ' ' : '') + `${filePrefix}: ${file.name}]`;
        chatMessageInput.focus();
        chatFileInput.value = '';
      }
    });
  }

  // -----------------------------------------------------------------
  // 10. Profile Modal & Settings
  // -----------------------------------------------------------------
  function openProfileModal() {
    updateProfileUI();
    profileAlert.style.display = 'none';
    profileModal.classList.add('active');
    profileDisplayName.focus();
  }

  function closeProfileModal() {
    profileModal.classList.remove('active');
    formChangePassword.reset();
  }

  if (railProfileAvatar) railProfileAvatar.addEventListener('click', openProfileModal);
  if (railBtnSettings) railBtnSettings.addEventListener('click', openProfileModal);
  if (footerProfileBox) footerProfileBox.addEventListener('click', openProfileModal);
  if (btnUserSettings) btnUserSettings.addEventListener('click', openProfileModal);
  if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeProfileModal);

  // Edit Profile Form Submit (Save to PostgreSQL)
  formEditProfile.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDisplayName = profileDisplayName.value.trim();
    const newEmail = profileEmail.value.trim();
    const btnSave = document.getElementById('btn-save-profile');

    btnSave.disabled = true;
    btnSave.textContent = 'Đang lưu vào cơ sở dữ liệu...';

    try {
      const res = await window.api.users.updateProfile({
        displayName: newDisplayName,
        email: newEmail || undefined,
      });

      currentUser.displayName = res.data.user.display_name;
      currentUser.email = res.data.user.email;
      window.api.setUser(currentUser);

      updateProfileUI();
      profileAlert.textContent = 'Đã lưu thông tin hồ sơ vào PostgreSQL thành công!';
      profileAlert.style.display = 'block';
      profileAlert.style.backgroundColor = '#F0FDF4';
      profileAlert.style.color = '#15803D';
      profileAlert.style.border = '1px solid #BBF7D0';

      setTimeout(() => {
        profileAlert.style.display = 'none';
      }, 3000);
    } catch (err) {
      profileAlert.textContent = err.message || 'Lỗi khi cập nhật hồ sơ.';
      profileAlert.style.display = 'block';
      profileAlert.style.backgroundColor = '#FFF0F3';
      profileAlert.style.color = '#E11D48';
      profileAlert.style.border = '1px solid #FFCCD5';
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Lưu Thay Đổi Thông Tin';
    }
  });

  // Change Password Form Submit (Verify old, hash new in PostgreSQL)
  formChangePassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = profileCurrentPass.value;
    const newPassword = profileNewPass.value;
    const confirmNewPassword = profileConfirmNewPass.value;
    const btnSavePass = document.getElementById('btn-save-password');

    if (newPassword.length < 6) {
      profileAlert.textContent = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
      profileAlert.style.display = 'block';
      return;
    }

    if (newPassword !== confirmNewPassword) {
      profileAlert.textContent = 'Mật khẩu mới xác nhận không khớp!';
      profileAlert.style.display = 'block';
      return;
    }

    btnSavePass.disabled = true;
    btnSavePass.textContent = 'Đang đổi mật khẩu...';

    try {
      const res = await window.api.users.changePassword({ currentPassword, newPassword });
      profileAlert.textContent = `${res.message || 'Đổi mật khẩu thành công!'}`;
      profileAlert.style.display = 'block';
      profileAlert.style.backgroundColor = '#F0FDF4';
      profileAlert.style.color = '#15803D';
      profileAlert.style.border = '1px solid #BBF7D0';
      formChangePassword.reset();

      setTimeout(() => {
        profileAlert.style.display = 'none';
      }, 4000);
    } catch (err) {
      profileAlert.textContent = err.message || 'Mật khẩu hiện tại không đúng.';
      profileAlert.style.display = 'block';
      profileAlert.style.backgroundColor = '#FFF0F3';
      profileAlert.style.color = '#E11D48';
      profileAlert.style.border = '1px solid #FFCCD5';
    } finally {
      btnSavePass.disabled = false;
      btnSavePass.textContent = 'Cập Nhật Mật Khẩu Mới';
    }
  });

  // -----------------------------------------------------------------
  // 11. Modal: Create Channel
  // -----------------------------------------------------------------
  btnCreateChannel.addEventListener('click', () => {
    createChannelModal.classList.add('active');
    modalChannelName.focus();
  });

  function closeCreateChannelModal() {
    createChannelModal.classList.remove('active');
    createChannelForm.reset();
  }

  btnCloseModal.addEventListener('click', closeCreateChannelModal);
  btnCancelModal.addEventListener('click', closeCreateChannelModal);

  createChannelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = modalChannelName.value.trim();
    const desc = modalChannelDesc.value.trim();
    const isPrivate = modalChannelPrivate.checked;
    if (!name) return;

    try {
      const res = await window.api.rooms.create({ name, description: desc, isPrivate });
      const newRoom = res.data.room;
      channels.push(newRoom);
      closeCreateChannelModal();
      renderChannels();
      switchChannel(newRoom);
    } catch (err) {
      alert(err.message || 'Không thể tạo phòng chat.');
    }
  });

  // -----------------------------------------------------------------
  // 12. Modals: Members, Notifications, Room Info & Left Rail Features
  // -----------------------------------------------------------------

  // A. Logo Heart Button -> Quick jump to main room & trigger floating hearts
  if (railLogoBtn) {
    railLogoBtn.addEventListener('click', () => {
      if (channels.length > 0) {
        switchChannel(channels[0]);
      }
      if (window.effects && typeof window.effects.spawnHeartExplosion === 'function') {
        const rect = railLogoBtn.getBoundingClientRect();
        window.effects.spawnHeartExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    });
  }

  // B. Chat Tab -> Focus chat & channels
  if (railBtnChat) {
    railBtnChat.addEventListener('click', () => {
      railBtnChat.classList.add('active');
      railBtnTeam.classList.remove('active');
      sidebarSearchInput.focus();
    });
  }

  // C. Members Tab & Modal
  function renderMembersDialog(filter = '') {
    if (!membersDialogList) return;
    const query = filter.toLowerCase().trim();
    const filtered = usersList.filter(u => {
      const name = (u.displayName || u.display_name || u.username || '').toLowerCase();
      const uname = (u.username || '').toLowerCase();
      return name.includes(query) || uname.includes(query);
    });

    if (filtered.length === 0) {
      membersDialogList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
          Không tìm thấy thành viên nào phù hợp
        </div>
      `;
      return;
    }

    membersDialogList.innerHTML = filtered.map(u => {
      const dName = escapeHTML(u.displayName || u.display_name || u.username);
      const uName = escapeHTML(u.username);
      const isMe = u.id === currentUser.id || u.username === currentUser.username;
      const isAdmin = currentUser.role === 'admin';
      const roleText = u.role === 'admin' ? 'Quản trị viên' : 'Thành viên trực tuyến';
      const avatarUrl = getAvatarUrl(u.username);

      return `
        <div class="member-dialog-card">
          <div class="member-card-left">
            <img src="${avatarUrl}" alt="${dName}" class="member-card-avatar">
            <div class="member-card-info">
              <span class="member-card-name">${dName} ${isMe ? '<span style="font-size: 11px; color: var(--primary-pink); font-weight: 800;">(Bạn)</span>' : ''}</span>
              <span class="member-card-username">@${uName} • ${roleText}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn-member-action" data-mention="${uName}">
              Nhắn tin
            </button>
            ${(!isMe && isAdmin) ? `
              <button type="button" class="btn-delete-user" data-user-id="${u.id}" data-user-name="${dName}" style="padding: 6px 10px; border: 1px solid #FECDD3; color: #E11D48; background: #FFF; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;" title="Xóa tài khoản người dùng này khỏi hệ thống">
                🗑 Xóa
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach click events on "Nhắn tin"
    membersDialogList.querySelectorAll('.btn-member-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const mentionUser = btn.getAttribute('data-mention');
        closeMembersModal();
        if (mentionUser) {
          chatMessageInput.value = `@${mentionUser} `;
          chatMessageInput.focus();
        }
      });
    });

    // Attach click events on "Xóa tài khoản" (admin only)
    membersDialogList.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-user-id');
        const uname = btn.getAttribute('data-user-name');
        if (!uid) return;
        if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${uname}" khỏi hệ thống không? Hành động này không thể hoàn tác.`)) {
          try {
            await window.api.users.delete(parseInt(uid, 10));
            await reloadUsersList();
            renderMembersDialog(membersModalSearch ? membersModalSearch.value : '');
          } catch (err) {
            alert(err.message || 'Không thể xóa tài khoản người dùng.');
          }
        }
      });
    });
  }

  function openMembersModal() {
    if (membersModal) {
      membersModal.classList.add('active');
      renderMembersDialog('');
      if (membersModalSearch) {
        membersModalSearch.value = '';
        membersModalSearch.focus();
      }
    }
  }

  function closeMembersModal() {
    if (membersModal) {
      membersModal.classList.remove('active');
    }
  }

  if (railBtnTeam) {
    railBtnTeam.addEventListener('click', () => {
      openMembersModal();
    });
  }

  if (btnCloseMembersModal) {
    btnCloseMembersModal.addEventListener('click', closeMembersModal);
  }

  if (membersModalSearch) {
    membersModalSearch.addEventListener('input', (e) => {
      renderMembersDialog(e.target.value);
    });
  }

  // D. Notifications Tab & Modal
  function openNotificationsModal() {
    if (notificationsModal) {
      notificationsModal.classList.add('active');
    }
  }

  function closeNotificationsModal() {
    if (notificationsModal) {
      notificationsModal.classList.remove('active');
    }
  }

  if (railBtnNotifications) {
    railBtnNotifications.addEventListener('click', openNotificationsModal);
  }

  if (btnCloseNotifModal) {
    btnCloseNotifModal.addEventListener('click', closeNotificationsModal);
  }

  // E. Room Info Modal & Member Management (Add & Remove)
  async function refreshRoomMembersList() {
    if (!roomInfoModal || !currentRoom) return;

    let roomMembers = [];
    try {
      const res = await window.api.rooms.members(currentRoom.id);
      if (res && res.data && res.data.members) {
        roomMembers = res.data.members;
      }
    } catch (e) {
      roomMembers = usersList;
    }

    const memberIds = new Set(roomMembers.map(m => m.id));

    // Populate Add Member select with users NOT in the room
    const selectAddMember = document.getElementById('select-add-member');
    if (selectAddMember) {
      const candidateUsers = usersList.filter(u => !memberIds.has(u.id));
      if (candidateUsers.length === 0) {
        selectAddMember.innerHTML = '<option value="">-- Tất cả thành viên đã có trong phòng --</option>';
        selectAddMember.disabled = true;
      } else {
        selectAddMember.disabled = false;
        selectAddMember.innerHTML = candidateUsers.map(u => {
          const dName = escapeHTML(u.displayName || u.display_name || u.username);
          return `<option value="${u.id}">${dName} (@${escapeHTML(u.username)})</option>`;
        }).join('');
      }
    }

    // Render Room Members with Remove button
    if (infoRoomMembersList) {
      if (roomMembers.length === 0) {
        infoRoomMembersList.innerHTML = '<div style="font-size: 12.5px; color: var(--text-muted); text-align: center; padding: 12px;">Chưa có thành viên nào</div>';
      } else {
        infoRoomMembersList.innerHTML = roomMembers.map(u => {
          const dName = escapeHTML(u.displayName || u.display_name || u.username);
          const uName = escapeHTML(u.username);
          const avatarUrl = getAvatarUrl(u.username);
          const isMe = u.id === currentUser.id || u.username === currentUser.username;
          const isAdmin = currentUser.role === 'admin';

          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--soft-pink-subtle); border-radius: 8px; border: 1px solid var(--soft-pink);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${avatarUrl}" width="34" height="34" style="border-radius: 50%; border: 1.5px solid var(--primary-pink); background: #FFF;">
                <div>
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--text-dark);">${dName} ${isMe ? '<span style="font-size: 10px; color: var(--primary-pink);">(Bạn)</span>' : ''}</div>
                  <div style="font-size: 11.5px; color: var(--rose);">@${uName}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; color: #16A34A; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                  <span style="width: 7px; height: 7px; background: #22C55E; border-radius: 50%; display: inline-block;"></span>
                  Online
                </span>
                ${(!isMe && isAdmin) ? `
                  <button type="button" class="btn-kick-member" data-user-id="${u.id}" data-user-name="${dName}" style="padding: 3px 8px; border: 1px solid #FECDD3; color: #E11D48; background: #FFF; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;" title="Xóa người này khỏi phòng">
                    ✕ Xóa
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');

        // Bind click on kick member buttons
        infoRoomMembersList.querySelectorAll('.btn-kick-member').forEach(btn => {
          btn.addEventListener('click', async () => {
            const uid = btn.getAttribute('data-user-id');
            const uname = btn.getAttribute('data-user-name');
            if (confirm(`Bạn có chắc chắn muốn xóa "${uname}" khỏi phòng "${currentRoom.name}" không?`)) {
              try {
                await window.api.rooms.leave(currentRoom.id, { userId: parseInt(uid, 10) });
                await refreshRoomMembersList();
              } catch (err) {
                alert(err.message || 'Không thể xóa thành viên khỏi phòng.');
              }
            }
          });
        });
      }
    }
  }

  async function openRoomInfoModal() {
    if (!roomInfoModal || !currentRoom) return;

    // Only admins can add members / delete the room; hide controls for regular users.
    const isAdmin = currentUser.role === 'admin';
    const addMemberSection = document.getElementById('add-member-section');
    if (addMemberSection) {
      addMemberSection.style.display = isAdmin ? 'block' : 'none';
    }
    const btnDeleteRoom = document.getElementById('btn-delete-room');
    if (btnDeleteRoom) {
      btnDeleteRoom.style.display = isAdmin ? 'block' : 'none';
    }

    if (infoRoomName) infoRoomName.textContent = currentRoom.name;
    if (infoRoomDesc) infoRoomDesc.textContent = currentRoom.description || 'Không gian trò chuyện và trao đổi công việc';
    if (infoRoomBadge) {
      infoRoomBadge.textContent = currentRoom.is_private ? 'Phòng Riêng Tư 🔒' : 'Phòng Công Khai';
    }

    await refreshRoomMembersList();
    roomInfoModal.classList.add('active');
  }

  function closeRoomInfoModal() {
    if (roomInfoModal) {
      roomInfoModal.classList.remove('active');
    }
  }

  if (btnRoomInfo) {
    btnRoomInfo.addEventListener('click', openRoomInfoModal);
  }

  if (btnCloseRoomInfoModal) {
    btnCloseRoomInfoModal.addEventListener('click', closeRoomInfoModal);
  }

  // Handle Add Member to Room Button
  const btnAddMemberToRoom = document.getElementById('btn-add-member-to-room');
  if (btnAddMemberToRoom) {
    btnAddMemberToRoom.addEventListener('click', async () => {
      const selectAddMember = document.getElementById('select-add-member');
      if (!selectAddMember || !selectAddMember.value || !currentRoom) return;
      const targetUserId = parseInt(selectAddMember.value, 10);
      try {
        await window.api.rooms.join(currentRoom.id, { userId: targetUserId });
        await refreshRoomMembersList();
        alert('Đã thêm thành viên vào phòng thành công!');
      } catch (err) {
        alert(err.message || 'Không thể thêm thành viên vào phòng.');
      }
    });
  }

  // Handle Leave Room Button
  const btnLeaveCurrentRoom = document.getElementById('btn-leave-current-room');
  if (btnLeaveCurrentRoom) {
    btnLeaveCurrentRoom.addEventListener('click', async () => {
      if (!currentRoom) return;
      if (confirm(`Bạn có chắc muốn rời khỏi phòng "${currentRoom.name}" không?`)) {
        try {
          await window.api.rooms.leave(currentRoom.id);
          closeRoomInfoModal();
          // Reload rooms and switch to first available room
          const roomsRes = await window.api.rooms.list();
          if (roomsRes && roomsRes.data && roomsRes.data.rooms) {
            channels = roomsRes.data.rooms;
            renderChannels();
            if (channels.length > 0) switchChannel(channels[0]);
          }
        } catch (err) {
          alert(err.message || 'Không thể rời phòng.');
        }
      }
    });
  }

  // Handle Delete Room Button (Admin only)
  const btnDeleteRoom = document.getElementById('btn-delete-room');
  if (btnDeleteRoom) {
    btnDeleteRoom.addEventListener('click', async () => {
      if (!currentRoom) return;
      if (confirm(`Bạn có chắc chắn muốn XÓA phòng "${currentRoom.name}" không? Toàn bộ tin nhắn trong phòng sẽ bị xóa vĩnh viễn.`)) {
        try {
          await window.api.rooms.delete(currentRoom.id);
          closeRoomInfoModal();
          const roomsRes = await window.api.rooms.list();
          channels = (roomsRes && roomsRes.data && roomsRes.data.rooms) || [];
          renderChannels();
          if (channels.length > 0) {
            switchChannel(channels[0]);
          } else {
            currentRoom = null;
            activeChannelName.textContent = 'Chưa có phòng';
            activeChannelDesc.textContent = 'Tạo phòng trò chuyện đầu tiên để bắt đầu.';
            activeHashtagIcon.textContent = '#';
            renderEmptyChatState();
          }
        } catch (err) {
          alert(err.message || 'Không thể xóa phòng.');
        }
      }
    });
  }

  // F. Close modals on backdrop click
  [createChannelModal, profileModal, membersModal, notificationsModal, roomInfoModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  });

  if (btnMobileToggle) {
    btnMobileToggle.addEventListener('click', () => {
      chatSidebar.classList.toggle('mobile-open');
    });
  }

  // Search Bar Filter
  sidebarSearchInput.addEventListener('input', (e) => {
    const text = e.target.value;
    renderChannels(text);
    renderUsers(text);
  });

  // Logout Handler
  btnLogout.addEventListener('click', async () => {
    try {
      await window.api.auth.logout();
    } catch {}
    window.api.clearAuth();
    window.location.href = '/login.html';
  });

  // -----------------------------------------------------------------
  // 13. Initial App Boot & Dynamic Data Load from PostgreSQL
  // -----------------------------------------------------------------
  async function initializeApp() {
    updateProfileUI();

    // 1. Load real users from PostgreSQL database
    try {
      const usersRes = await window.api.users.list();
      if (usersRes && usersRes.data && usersRes.data.users) {
        usersList = usersRes.data.users;
      }
    } catch (err) {
      console.warn('Could not load users list from API, fallback to current user:', err);
      usersList = [currentUser];
    }
    renderUsers();

    // 2. Load real rooms from PostgreSQL database
    try {
      const roomsRes = await window.api.rooms.list();
      if (roomsRes && roomsRes.data && roomsRes.data.rooms && roomsRes.data.rooms.length > 0) {
        channels = roomsRes.data.rooms;
      } else {
        channels = [];
      }
    } catch (err) {
      channels = [];
    }
    renderChannels();

    // 3. Auto-select first channel (or show empty state)
    if (channels.length > 0) {
      switchChannel(channels[0]);
    } else {
      activeChannelName.textContent = 'Chưa có phòng';
      activeChannelDesc.textContent = 'Tạo phòng trò chuyện đầu tiên để bắt đầu.';
      activeHashtagIcon.textContent = '#';
      renderEmptyChatState();
    }
  }

  initializeApp();
});
