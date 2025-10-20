document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('#contactForm');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        form.classList.add('was-validated');
        if (!form.checkValidity()) {
            return; // Bootstrap shows errors
        }

        const data = {
            firstName: form.firstName.value.trim(),
            lastName: form.lastName.value.trim(),
            email: form.email.value.trim(),
            company: form.company.value.trim(),
            phone: form.phone.value.trim(),
            extension: form.extension.value.trim(),
            message: form.message.value.trim()
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                showContactSuccessPopup();   // <-- Call this first
                form.reset();                // <-- THEN reset the form                
                form.classList.remove('was-validated'); // <-- Remove validation state after reset
            } else {
                alert('There was a problem submitting the form. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting the form. Please try again.', err);
            showContactErrorPopup();
        }
    });

    // Helper: Clear all validation styles
    function clearValidation(form) {
        form.classList.remove('was-validated');
        Array.from(form.elements).forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
    }

    // Branded success popup
    window.showContactSuccessPopup = function () {
        let modal = document.getElementById('contactSuccessModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="contactSuccessModal" tabindex="-1" aria-hidden="true">
                  <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content text-center">
                      <div class="modal-header border-0">
                        <h4 class="modal-title d-flex align-items-center justify-content-center w-100 m-0">
                          <div class="rounded-circle d-inline-flex align-items-center justify-content-center"
                              style="width:50px; height:50px; background:#44d07b;">
                            <i class="bi bi-hand-thumbs-up text-white" style="font-size:2rem;"></i>
                          </div>
                          <span style="padding-left: 16px;">Thank You!</span>
                        </h4>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div class="modal-body pb-4">
                        <p class="lead mb-0">
                          Your message has been received.<br>
                          We'll be reaching out shortly.<br><br>
                          <span class="text-primary fw-bold">Vulpine Solutions</span>
                        </p>
                        <p class="small text-muted mt-3 mb-0">
                          Need immediate help? Call <a href="tel:+18134214443">(813)421-4443</a>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            `);
            modal = document.getElementById('contactSuccessModal');
        }
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    };
});

document.addEventListener('DOMContentLoaded', function () {
    var phoneInput = document.getElementById('phone');
    var phoneMask = IMask(phoneInput, {
        mask: [
            // With country code 1
            {
                mask: '1(000)000-0000',
                country: 'US'
            },
            // Without country code
            {
                mask: '(000)000-0000',
                country: 'US'
            }
        ]
    });
});