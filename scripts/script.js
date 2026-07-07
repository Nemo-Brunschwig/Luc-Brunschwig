const divBD = document.querySelector("#BD"); // récupération de l'emplacement des BDs
const divModal = document.querySelector("#MODALS"); // récupération de l'emplacment des modals
const lucReq = new XMLHttpRequest(); // objet pour faire les requêtes http

// magouilles pour que ça se passe bien xD
let allSeries = [];
if (localStorage['allSeries'] === undefined) {
  // tableau pour stocker les BDs (objets)
  localStorage['allSeries'] = "";
} else {
  try {
    allSeries = JSON.parse(localStorage['allSeries']);
  } catch (e) {
    localStorage['allSeries'] = "";
  }
}

lucReq.open("GET", "https://www.bedetheque.com/auteur-4544-BD-Brunschwig-Luc.html", true); // requête sur la page de Luc Brunschwig
lucReq.responseType = "document"; // on veut une réponse de type "document"

// traitement des données
lucReq.onreadystatechange = async function(e) {
  // quand la page a finie de load (c'pas tout a fait vrai mais bon)
  if (this.readyState === 4){
    const documentLuc = lucReq.response; // récupération de la page
    // on cherche le tableau qui contient les séries et on récupère toutes les lignes
    const lines = documentLuc.querySelector("table").querySelector("tbody").querySelectorAll("tr");
    // on parcour les lignes
    lines.forEach(line => {
      const Serie = {}; // objet Serie qui sera stocké dans le tableau

      // on stock tous les éléments dans une variable (au cas où)
      const items = line.querySelectorAll("td");
      if (items[0].querySelector(".ico").querySelector("img").getAttribute("src").endsWith("France.png")) {

        // on récupère son nom ça peut être bien
        const name = items[0].querySelector(".serie").innerText;

        // Si la série est déjà enregistré en local, ça sert à rien de refaire une requête dessus (et si y a pas de nouvelle sortie)
        if (allSeries.find(serie => serie.name === name) === undefined || allSeries.find(serie => serie.name === name).dateFin !== parseInt(items[2].innerText.replace(/\D/g, ""), 10) || allSeries.find(serie => serie.name === name).BDs === undefined) {
          Serie.name = name; // on ajoute l'attribut "name"

          // on récupère le lien pour avoir des infos sur la série en question
          let link = items[0].querySelector(".serie").querySelector("a").getAttribute("href");
          link = link.replace(".html", "__10000.html"); // on ajoute "__10000" pour avoir toutes les BDs sur la page
          Serie.link = link; // on remplit l'objet en ajoutant l'attribut "link"

          // on récupère la date de début de sortie (pour faire un trie plus tard)
          let dateDeb = items[1].innerText;
          dateDeb = dateDeb.replace(/\D/g, ""); // il y avait un truc bizarre dans la string du coup je fais en sorte de récupérer que les chiffres
          Serie.dateDeb = parseInt(dateDeb, 10); // on ajoute l'attribut "dateDeb" converti en int

          // on récupère la date de fin de sortie (pour vérifier plus tard qu'il n'y a pas une nouvelle BD)
          let dateFin = items[2].innerText;
          dateFin = dateFin.replace(/\D/g, ""); // il y avait un truc bizarre dans la string du coup je fais en sorte de récupérer que les chiffres
          Serie.dateFin = parseInt(dateFin, 10); // on ajoute l'attribut "dateFin" converti en int

          // récupération des données sur la BD
          const bdReq = new XMLHttpRequest();
          bdReq.open("GET", link, true);
          bdReq.responseType = "document";
          bdReq.onreadystatechange = async function (e) {
            if (this.readyState === 4){
              const documentBD = bdReq.response; // page de la BD
              const allNodes = Array.prototype.slice.call(documentBD.querySelector(".liste-albums").childNodes); // on récupère la liste des BDs \...
              const listBDs = allNodes.filter(item => item.nodeName === "LI"); // ...\
              let linkImg = ""; // on prépare la variable
              Serie.BDs = []; // on prépare la liste des BDs de la série
              // on parcour la liste pour chopper des infos sur les BDs
              let findImg = false;
              for (let i = 0; i < listBDs.length; i++) {
                await until(_ => listBDs[i].querySelector(".infos") != null);
                await until(_ => listBDs[i].querySelector(".infos").children.length > 0);

                // on s'en occupe que si c'est une BD de luc
                if(listBDs[i].querySelector(".infos").innerText.includes("Brunschwig, Luc")){
                  let BD = {}; // on prépare l'objet BD qui va être ajouté à la liste
                  let albumMain = listBDs[i].querySelector(".album-main");
                  // récupération du titre de la BD (et j'vire les espèces de blanc bizarre 🤔)
                  let name = albumMain.querySelector(".titre").querySelector("span").innerText.split(".");
                  BD.name = name[name.length-1].trim();
                  // récupération de la couv'
                  const imgs = listBDs[i].querySelector(".couv").querySelectorAll("img");
                  BD.img = imgs[imgs.length - 1].getAttribute("src");
                  // récupération de l'image de couv (du tome 1 ou du tome fait par Luc)
                  if (!findImg){
                    linkImg = BD.img;
                    findImg = true;
                  }
                  // récupération de la note
                  BD.note = albumMain.querySelector(".eval").querySelector(".message").innerText;

                  // on parcour les éléments
                  for (const li of albumMain.querySelector(".infos").querySelectorAll("li")) {
                    // on récupère l'éditeur
                    if (li.querySelector("label").innerText === "Editeur : "){
                      BD.editeur = li.querySelector("span").innerText;
                    }

                    // on récupère la collection (si il y a)
                    if (li.querySelector("label").innerText === "Collection : "){
                      BD.collection = li.querySelector("a").innerText;
                    }
                  }
                  // ajout de la BD dans la série
                  Serie.BDs.push(BD);
                }
              }
              // await until(_ => linkImg != "");
              linkImg = linkImg.replace("cache/thb_couv", "media/Couvertures"); // on arrange l'URL pour avoir l'image en grand
              Serie.img = linkImg; // on ajoute l'attribut "img"
              allSeries.push(Serie); // on ajoute la série au tableau
            }
          }
          bdReq.send();
        }
      }
    });
    // on attend que la liste soit remplie
    await until(_ => allSeries.length > 20);
    // trie de la liste par date
    await allSeries.sort((a, b) => a.dateDeb - b.dateDeb);
    // on enregistre la liste en local
    localStorage["allSeries"] = JSON.stringify(allSeries);
    // affichage des BDs
    await ShowBDs(allSeries);
  }
}
lucReq.send();










async function ShowBDs(series) {
  for (let i = 0; i < series.length; i++) {
    divBD.innerHTML += `<div class="col-lg-2 text-center text-break" data-bs-toggle="modal" data-bs-target="#bd${i}">
        <img class="rounded" src="${series[i].img}" alt="${series[i].name}">
        <p>${series[i].name}</p>
      </div>`;

    divModal.innerHTML += `<div class="modal fade" id="bd${i}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content bg-dark">
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          <div class="modal-body text-center">
            <h1 class="modal-title" id="staticBackdropLabel">${series[i].name}</h1>
            <div class="divider-custom">
              <div class="divider-custom-line ${(localStorage['theme'] === "darkTheme"?"divider-light":"divider-dark")}"></div>
              <div class="divider-custom-icon"><i class="fa-solid fa-book-open"></i></div>
              <div class="divider-custom-line ${(localStorage['theme'] === "darkTheme"?"divider-light":"divider-dark")}"></div>
            </div>
            <a href="${series[i].link}" rel="nofollow" target="_blank">
              <img class="modal-img rounded" src="${series[i].img}" alt="${series[i].name}">
            </a>

            <h2 class="mt-5">BDs de la série</h2>
            <div class="divider-custom">
              <div class="divider-custom-line ${(localStorage['theme'] === "darkTheme"?"divider-light":"divider-dark")}"></div>
              <div class="divider-custom-icon"><i class="fa-solid fa-book-open"></i></div>
              <div class="divider-custom-line ${(localStorage['theme'] === "darkTheme"?"divider-light":"divider-dark")}"></div>
            </div>

            <div class="BDs">

            </div>
          </div>
        </div>
      </div>
    </div>`

    for (let j = 0; j < series[i].BDs.length; j++) {
      divModal.querySelector(`#bd${i}`).querySelector(".BDs").innerHTML += `
        <h3 class="mt-2">${series[i].BDs[j].name}</h3>
        <div class="row">
          <div class="col-lg-6">
            <img class="bd-modal-img" src="${series[i].BDs[j].img}" alt="image de couverture du tome">
          </div>
          <div class="col-lg-6">
            <div class="bd-modal-txt">
              <p>${series[i].BDs[j].note}</p>
              <p>Éditeur : ${series[i].BDs[j].editeur}</p>`
        +    (series[i].BDs[j].collection !== undefined?`<p>Collection : ${series[i].BDs[j].collection}</p>`:"")
        +  `</div>
          </div>
        </div>`;
    }
  }
  const divLoad = divBD.querySelector(".lds-ring"); // récupération de la div de chargement (pour la delete après)
  divLoad.remove(); // delete le load
}

window.until = function(conditionFunction) {

  const poll = resolve => {
    if(conditionFunction()) resolve();
    else setTimeout(_ => poll(resolve), 500);
  }

  return new Promise(poll);
}
