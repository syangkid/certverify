// public/js/students.js
// Runs in the browser on the Students page.
// The same form is used to register (POST) or edit (PUT) a student.

const form = document.getElementById('student-form');
const idField = document.getElementById('student-id');
const nameField = document.getElementById('name');
const numberField = document.getElementById('student-number');
const institutionGroup = document.getElementById('institution-group'); // only exists for the Admin
const institutionField = document.getElementById('institution');
const loginHeading = document.getElementById('login-heading');
const loginHint = document.getElementById('login-hint');
const loginFields = document.getElementById('login-fields');
const loginText = document.getElementById('login-text');
const emailField = document.getElementById('email');
const passwordField = document.getElementById('password');
const formTitle = document.getElementById('form-title');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const message = document.getElementById('message');

function showError(text) {
  message.textContent = text;
  message.hidden = false;
}

// Back to "register" mode.
function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Register student';
  saveButton.textContent = 'Register student';
  cancelButton.hidden = true;
  message.hidden = true;
  if (institutionGroup) institutionGroup.hidden = false;
  loginHeading.textContent = 'Login account (optional)';
  loginHint.hidden = false;
  loginFields.hidden = false;
  loginText.hidden = true;
}

// "Edit" buttons: copy the row's data into the form and switch to "edit" mode.
document.querySelectorAll('.edit-button').forEach((button) => {
  button.addEventListener('click', () => {
    const data = button.dataset;
    idField.value = data.id;
    nameField.value = data.name;
    numberField.value = data.number;
    emailField.value = '';
    passwordField.value = '';

    formTitle.textContent = 'Edit student';
    saveButton.textContent = 'Save changes';
    cancelButton.hidden = false;
    message.hidden = true;
    if (institutionGroup) institutionGroup.hidden = true; // the institution cannot be changed

    if (data.email) {
      // The student already has a login: just show it.
      loginHeading.textContent = 'Login account';
      loginHint.hidden = true;
      loginFields.hidden = true;
      loginText.textContent = 'This student signs in with: ' + data.email;
      loginText.hidden = false;
    } else {
      // No login yet: staff can create one now.
      loginHeading.textContent = 'Create login account (optional)';
      loginHint.hidden = false;
      loginFields.hidden = false;
      loginText.hidden = true;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    nameField.focus();
  });
});

cancelButton.addEventListener('click', resetForm);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;

  const editing = idField.value !== '';
  const url = editing ? `/api/students/${idField.value}` : '/api/students';

  const body = {
    name: nameField.value,
    student_number: numberField.value,
    email: emailField.value,
    password: passwordField.value,
  };
  // The institution is only chosen when registering, and only by the Admin.
  if (!editing && institutionField) {
    body.institution_id = institutionField.value;
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
