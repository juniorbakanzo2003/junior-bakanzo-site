const form = document.getElementById("registrationForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const activity = document.getElementById("activity").value;

    message.textContent = "⏳ Enregistrement en cours...";

    try {
        const response = await fetch("/api/inscriptions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                activity
            })
        });

        const data = await response.json();

        if (data.success) {
            message.textContent =
                "✅ Merci " + name +
                " ! Ton inscription à l'activité « " +
                activity +
                " » a bien été enregistrée.";

            form.reset();
        } else {
            message.textContent =
                "❌ " + data.message;
        }

    } catch (error) {
        console.error(error);

        message.textContent =
            "❌ Impossible de contacter le serveur.";
    }
});