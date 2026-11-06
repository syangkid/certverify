// public/js/users.js
// Runs in the browser on the Users page.
// The same form is used to add (POST) or edit (PUT) a user.

const form = document.getElementById('user-form');
const idField = document.getElementById('user-id');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const passwordField = document.getElementById('password');
const passwordLabel = document.getElementById('password-label');
const roleGroup = document.getElementById('role-group');
const roleField = document.getElementById('role');
const roleText = document.getElementById('role-text');
const institutionGroup = document.getElementById('institution-group');
const institutionField = document.getElementById('institution');
const statusGroup = document.getElementById('status-group');
const statusField = document.getElementById('status');
const formTitle = document.getElementById('form-title');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const message = document.getElementById('message');

function showError(text) {
  message.textContent = text;
  message.hidden = false;
}

// The institution dropdown is only needed for institution staff.
function updateInstitutionVisibility(role) {
  institutionGroup.hidden = role !== 'INSTITUTION_STAFF';
}

roleField.addEventListener('change', () => updateInstitutionVisibility(roleField.value));

// Back to "add" mode.
function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Add user';
  saveButton.textContent = 'Add user';
  passwordLabel.textContent = 'Password (minimum 8 characters)';
  passwordField.required = true;
  roleGroup.hidden = false;
  roleText.hidden = true;
  statusGroup.hidden = true;
  cancelButton.hidden = true;
  message.hidden = true;
  updateInstitutionVisibility(roleField.value);
}

// "Edit" buttons: copy the row's data into the form and switch to "edit" mode.
document.querySelectorAll('.edit-button').forEach((button) => {
  button.addEventListener('click', () => {
    const data = button.dataset;
    idField.value = data.id;
    nameField.value = data.name;
    emailField.value = data.email;
    statusField.value = data.status;
    institutionField.value = data.institutionId;
    passwordField.value = '';

    formTitle.textContent = 'Edit user';
    saveButton.textContent = 'Save changes';
    passwordLabel.textContent = 'New password (leave blank to keep the current one)';
    passwordField.required = false;
    roleGroup.hidden = true;                       // the role cannot be changed
    roleText.textContent = 'Role: ' + data.role.replace('_', ' ');
    roleText.hidden = false;
    statusGroup.hidden = false;
    cancelButton.hidden = false;
    message.hidden = true;
    updateInstitutionVisibility(data.role);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    nameField.focus();
  });
});

cancelButton.addEventListener('click', resetForm);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;

  const editing = idField.value !== '';
  const url = editing ? `/api/users/${idField.value}` : '/api/users';

  const body = {
    name: nameField.value,
    email: emailField.value,
    password: passwordField.value,
    institution_id: institutionField.value,
  };
  if (editing) {
    body.status = statusField.value;
  } else {
    body.role = roleField.value;
  }

  try {
    const response = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (response.ok) {
      window.location.reload();
      return;
    }
    showError(data.message || 'Something went wrong.');
  } catch (err) {
    showError('Could not reach the server. Please try again.');
  }
});

resetForm(); // start in "add" mode (also sets the institution dropdown correctly)
