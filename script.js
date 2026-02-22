let currentStep = 1;
function highlightNextStep() {
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.remove("active");
  });
  document.getElementById(`step-${currentStep}`).classList.add("active");
  currentStep++;
  if (currentStep > 3) {
    currentStep = 1;
  }
}

setInterval(highlightNextStep, 3000);
highlightNextStep();
function generatePhoneNumber() {
  const ddd = Math.floor(10 + Math.random() * 89);
  const firstPart = Math.floor(90000 + Math.random() * 9999)
    .toString()
    .slice(0, 5);
  const secondPart = Math.floor(1000 + Math.random() * 9000);
  return `(${ddd}) 9${firstPart}-${secondPart}`;
}

/** Número formatado com os 4 últimos dígitos mascarados: (11) 98765-**** */
function generatePhoneNumberMasked() {
  const ddd = Math.floor(10 + Math.random() * 89);
  const firstPart = Math.floor(90000 + Math.random() * 9999)
    .toString()
    .slice(0, 5);
  return `(${ddd}) 9${firstPart}-****`;
}

/* Nomes e fotos por gênero (perfil01–21: ímpares = homens, pares = mulheres; ajuste se precisar) */
const NOMES_HOMENS = ["Bruno", "Diego", "Felipe", "Henrique", "João", "Marcos", "Pedro", "Thiago", "Lucas", "Rodrigo", "Gustavo", "Leonardo"];
const NOMES_MULHERES = ["Ana", "Carla", "Elena", "Gabriela", "Isabela", "Larissa", "Natália", "Rafaela", "Mariana", "Julia", "Fernanda", "Amanda"];
const FOTOS_HOMENS = ["01", "03", "05", "07", "09", "11", "13", "15", "17", "19", "21"];
const FOTOS_MULHERES = ["02", "04", "06", "08", "10", "12", "14", "16", "18", "20"];

function showConsultaPushup() {
  const container = document.getElementById("consultas-ao-vivo");
  if (!container) return;

  const ehHomem = Math.random() < 0.5;
  const nomes = ehHomem ? NOMES_HOMENS : NOMES_MULHERES;
  const fotos = ehHomem ? FOTOS_HOMENS : FOTOS_MULHERES;
  const nome = nomes[Math.floor(Math.random() * nomes.length)];
  const imgNumber = fotos[Math.floor(Math.random() * fotos.length)];
  const numero = generatePhoneNumberMasked();

  container.innerHTML = "";
  const el = document.createElement("div");
  el.className = "consultas-pushup-item";
  el.setAttribute("role", "status");
  el.innerHTML =
    '<img class="avatar" src="pessoas/perfil' + imgNumber + '.jpg" alt="">' +
    '<div class="texto">' +
      '<span class="nome">' + nome + '</span> fez a consulta agora do número: <span class="numero">' + numero + '</span>' +
    '</div>';
  container.appendChild(el);
}

function initConsultasAoVivo() {
  const container = document.getElementById("consultas-ao-vivo");
  if (!container) return;
  setTimeout(showConsultaPushup, 5000);
  setInterval(showConsultaPushup, 12000);
}

function updateInvestigations() {
  const investigationsList = document.getElementById("investigations-list");
  if (!investigationsList) return;
  investigationsList.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    const investigationItem = document.createElement("div");
    investigationItem.classList.add(
      "flex",
      "items-center",
      "bg-green-500",
      "p-3",
      "rounded-lg",
      "shadow-md"
    );

    const imgNumber = String(Math.floor(Math.random() * 21) + 1).padStart(
      2,
      "0"
    );
    const img = document.createElement("img");
    img.src = `pessoas/perfil${imgNumber}.jpg`;
    img.alt = "Perfil";
    img.classList.add(
      "w-10",
      "h-10",
      "rounded-full",
      "mr-3",
      "border-2",
      "border-white",
      "object-cover"
    );

    const phoneNumber = document.createElement("span");
    phoneNumber.classList.add("text-black", "font-bold");
    phoneNumber.innerText = generatePhoneNumber();

    investigationItem.appendChild(img);
    investigationItem.appendChild(phoneNumber);
    investigationsList.appendChild(investigationItem);
  }
}

setInterval(updateInvestigations, 5000);
updateInvestigations();

const countrySelect = document.getElementById("country-select");
if (countrySelect) {
  countrySelect.addEventListener("change", function () {
    let selectedOption = this.options[this.selectedIndex];
    let countryCode = selectedOption.getAttribute("data-code");
    let countryPrefix = selectedOption.getAttribute("data-prefix");
    const flag = document.getElementById("country-flag");
    const code = document.getElementById("country-code");
    if (flag) flag.src = `https://flagcdn.com/w40/${countryCode}.png`;
    if (code) code.textContent = countryPrefix;
  });
}

document.addEventListener("DOMContentLoaded", initConsultasAoVivo);

const buttons = document.querySelectorAll(".tab-button");
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

function validateAndShowModal() {
  let phoneNumber = document.getElementById("phone-number").value.trim();
  let phonePattern = /^\d{10,11}$/;

  if (!phonePattern.test(phoneNumber)) {
    document.getElementById("error-modal").classList.remove("hidden");
    return;
  }

  sessionStorage.setItem("phoneNumber", phoneNumber);

  document.getElementById("progress-modal").classList.remove("hidden");
  startProgress();
}

function closeErrorModal() {
  document.getElementById("error-modal").classList.add("hidden");
}

function startProgress() {
  let progressBar = document.getElementById("progress-bar");
  let progressText = document.getElementById("progress-text");

  let steps = [
    "Iniciando...",
    "Conectando ao servidor...",
    "Simulando IP...",
    "Ignorando firewall...",
    "Injetando consultas SQL...",
    "Buscando informações...",
    "Quebrando senha...",
    "Autenticando...",
    "Acesso concedido, redirecionando...",
  ];

  let currentStep = 0;
  let progress = 0;

  let interval = setInterval(() => {
    if (progress >= 100) {
      clearInterval(interval);

      const countryCode =
        document.querySelector("#country-code")?.textContent || "+55";

      const phone = sessionStorage.getItem("phoneNumber");
      const fullNumber = encodeURIComponent(`${countryCode}${phone}`);

      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("tel", fullNumber);

      const redirectUrl = "/consulta?" + currentParams.toString();

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);
      return;
    }

    progress += 12.5;
    progressBar.style.width = progress + "%";
    progressBar.innerText = Math.round(progress) + "%";
    progressText.innerText = steps[currentStep] || "Processando...";

    currentStep++;
  }, 1000);
}

document
  .querySelector(".btn-send")
  .addEventListener("click", validateAndShowModal);
document
  .querySelector(".btn-espiar")
  .addEventListener("click", validateAndShowModal);

function insertVturbVideo() {
  const videoHTML = `
                          <div id="vid_679191332688bd5126e4dac5" style="position: relative; width: 100%; padding: 56.25% 0 0;"> <img id="thumb_679191332688bd5126e4dac5" src="https://images.converteai.net/9581cd38-0dee-4366-bfd7-eeb983591eda/players/679191332688bd5126e4dac5/thumbnail.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block;" alt="thumbnail"> <div id="backdrop_679191332688bd5126e4dac5" style=" -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); position: absolute; top: 0; height: 100%; width: 100%; "></div> </div> <script type="text/javascript" id="scr_679191332688bd5126e4dac5"> var s=document.createElement("script"); s.src="https://scripts.converteai.net/9581cd38-0dee-4366-bfd7-eeb983591eda/players/679191332688bd5126e4dac5/player.js", s.async=!0,document.head.appendChild(s); </script> <style> .elementor-element:has(#smartplayer) { width: 100%; } </style>
      `;

  $("#vsl").html(videoHTML);
}

function setBackRedirect(newUrl) {
  urlBackRedirect =
    newUrl.trim() +
    (newUrl.indexOf("?") > 0 ? "&" : "?") +
    document.location.search.replace("?", "").toString();

  // Reinicia a lógica de manipulação de histórico após a atualização
  history.replaceState({}, "", location.href);
  history.pushState({}, "", location.href);
}
