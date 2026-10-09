const searchInput = document.getElementById("searchInput");
const categoryInputs = document.querySelectorAll(
    'input[name="category"]'
);

const resultsGrid = document.getElementById("resultsGrid");
const resultCount = document.getElementById("resultCount");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");

const pageInfo =
    document.getElementById("pageInfo");

let currentPage = 1;
const limit = 12;

let debounceTimer;


// Get selected category
function getCategory() {

    const selected = document.querySelector(
        'input[name="category"]:checked'
    );

    return selected ? selected.value : "All";
}


// Load results
async function loadResults() {

    loading.style.display = "block";
    resultsGrid.innerHTML = "";
    emptyState.style.display = "none";

    const search = searchInput.value.trim();
    const category = getCategory();

    const params = new URLSearchParams({
        search: search,
        category: category,
        page: currentPage,
        limit: limit
    });

    try {

        const response = await fetch(
            `/api/search?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Failed to load results");
        }

        const data = await response.json();

        displayResults(data);

    } catch (error) {

        console.error(error);

        resultCount.textContent =
            "Unable to load results.";

    } finally {

        loading.style.display = "none";
    }
}


// Display results
function displayResults(data) {

    resultsGrid.innerHTML = "";

    resultCount.textContent =
        `${data.total} result(s) found`;

    pageInfo.textContent =
        `Page ${data.page} of ${Math.max(data.totalPages, 1)}`;

    previousButton.disabled =
        data.page <= 1;

    nextButton.disabled =
        data.page >= data.totalPages ||
        data.totalPages === 0;


    if (data.results.length === 0) {

        emptyState.style.display = "block";

        return;
    }


    data.results.forEach(product => {

        const card =
            document.createElement("article");

        card.className = "result-card";

        card.innerHTML = `
            <h3>${product.name}</h3>

            <span class="category">
                ${product.category}
            </span>

            <p>
                ${product.description}
            </p>
        `;

        resultsGrid.appendChild(card);
    });
}


// Search with debounce
searchInput.addEventListener(
    "input",
    () => {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {

            currentPage = 1;
            loadResults();

        }, 400);
    }
);


// Category filter
categoryInputs.forEach(input => {

    input.addEventListener(
        "change",
        () => {

            currentPage = 1;
            loadResults();

        }
    );
});


// Previous page
previousButton.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            currentPage--;

            loadResults();
        }
    }
);


// Next page
nextButton.addEventListener(
    "click",
    () => {

        currentPage++;

        loadResults();
    }
);


// Initial load
loadResults();