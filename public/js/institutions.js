// public/js/institutions.js
// Runs in the browser on the Institutions page.
// The same form is used to add (POST) or edit (PUT) an institution.

const form = document.getElementById('institution-form');
const idField = document.getElementById('institution-id');
const nameField = document.getElementById('institution-name');
const formTitle = document.getElementById('form-title');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const message = document.getElementById('message');

function showError(text) {
  message.textContent = text;
  message.hidden = false;
}

// Back to "add" mode.
function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Add institution';
  saveButton.textContent = 'Add institution';
  cancelButton.hidden = true;
  message.hidden = true;
}

// "Edit" buttons: copy the row's data into the form and switch to "edit" mode.
document.querySelectorAll('.edit-button').forEach((button) => {
  button.addEventListener('click', () => {
    idField.value = button.dataset.id;
    nameField.value = button.dataset.name;
    formTitle.textContent = 'Edit institution';
    saveButton.textContent = 'Save changes';
    cancelButton.hidden = false;
    message.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    nameField.focus();
  });
});

cancelButton.addEventListener('click', resetForm);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;

  const editing = idField.value !== '';
  const url = editing ? `/api/institutions/${idField.value}` : '/api/institutions';

  try {
    const response = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_name: nameField.value }),
    });
    const data = await response.json();

    if (response.ok) {
      window.location.reload(); // reload so the table shows the change
      return;
    }
    showError(data.message || 'Something went wrong.');
  } catch (err) {
    showError('Could not reach the server. Please try again.');
  }
});
