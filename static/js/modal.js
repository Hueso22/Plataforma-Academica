function openModal(id) {
    const dialog = document.getElementById(id);
    if (dialog) dialog.showModal();
}

function closeModal(id) {
    const dialog = document.getElementById(id);
    if (dialog) dialog.close();
}

// Close dialog on backdrop click
document.addEventListener('click', (event) => {
    if (event.target.tagName === 'DIALOG') {
        event.target.close();
    }
});
