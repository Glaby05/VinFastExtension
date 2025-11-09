if (!document.getElementById("vinfast-btn")) {
  const button = document.createElement("button");
  button.id = "vinfast-btn";
  button.textContent = "Is EV for you?";
  document.body.appendChild(button);

  button.addEventListener("click", () => {
    // open in same tab
    window.location.href = "http://localhost:5050";

  });
}
