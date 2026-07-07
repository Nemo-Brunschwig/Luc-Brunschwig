async function Redim() {
  let navTab = document.querySelector("#StoryTab");
  let dropdown = navTab.querySelector(".dropdown");
  await until(_ => dropdown !== null);
  let tabs = navTab.querySelectorAll(".nav-link");
  await until(_ => tabs.length >= 10);

  let items = dropdown.querySelectorAll("li");
  dropdown.innerHTML = "";
  await items.forEach(async item => {
    await item.querySelector("button").setAttribute("class", `nav-link ${(item.querySelector("button").getAttribute("class").includes("active")?"active":"")}`);
    await navTab.append(item);
  });
  await navTab.append(dropdown);

  while (navTab.offsetHeight > 42) {
    let tab = tabs[tabs.length - 1];
    if (tab.getAttribute("class").includes("dropdown")) {
      tab = tabs[tabs.length - 2];
    }
    let li = tab.parentNode;
    tab.setAttribute("class", `dropdown-item ${localStorage['theme']==="darkTheme"?"text-white":""} ${(tab.getAttribute("class").includes("active")?"active":"")}`);
    if (dropdown.innerHTML === "") {
      dropdown.innerHTML = `
        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Autres </a>
        <ul class="dropdown-menu ${localStorage['theme']==="darkTheme"?"bg-dark":"bg-light"}">
        </ul>`;
    }
    let droplist = dropdown.querySelector("ul");
    droplist.insertBefore(li, droplist.firstChild);
    tabs = navTab.querySelectorAll(".nav-link");
  }
}

window.addEventListener("DOMContentLoaded", Redim);
window.addEventListener("resize", Redim);
