addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('https://your-cloudflare-worker-url', {
        method: 'POST',
        body: formData,
    });
    if (response.ok) {
        alert('Form submitted successfully!');
    } else {
        alert('There was a problem with your submission.');
    }
});
