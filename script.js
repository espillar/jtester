document.addEventListener('DOMContentLoaded', () => {
    // --- DATA ---
    let allCards = {}; // Store all cards by ID for easy lookup
    let column1CardIds = []; // IDs of cards in column 1
    let nextCardId = 1;
    let selectedCol1CardId = null;
    let selectedCol2CardId = null;

    // --- DOM ELEMENTS ---
    const cardTextInput = document.getElementById('card-text-input');
    const addCardButton = document.getElementById('add-card-button');
    const column1El = document.getElementById('column-1');
    const column2El = document.getElementById('column-2');
    const column3El = document.getElementById('column-3');

    // --- FUNCTIONS ---

    function getCard(cardId) {
        return allCards[cardId];
    }

    function createCardObject(text) {
        const newId = nextCardId++;
        const card = {
            id: newId,
            text: text,
            children: []
        };
        allCards[newId] = card;
        return card;
    }

    function renderCards(columnElement, cardIdsToRender) {
        const h2 = columnElement.querySelector('h2');
        columnElement.innerHTML = '';
        if (h2) columnElement.appendChild(h2);

        cardIdsToRender.forEach(id => {
            const card = getCard(id);
            if (!card) return;

            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.textContent = card.text;
            cardDiv.dataset.cardId = card.id;

            let columnNumber;
            if (columnElement === column1El) columnNumber = 1;
            else if (columnElement === column2El) columnNumber = 2;
            else if (columnElement === column3El) columnNumber = 3;

            if (columnNumber === 1 || columnNumber === 2) {
                 cardDiv.addEventListener('click', () => handleCardSelection(card.id, columnNumber));
            }

            if ((columnNumber === 1 && card.id === selectedCol1CardId) ||
                (columnNumber === 2 && card.id === selectedCol2CardId)) {
                cardDiv.classList.add('selected');
            }

            columnElement.appendChild(cardDiv);
        });
    }

    function handleCardSelection(cardId, columnNumber) {
        if (columnNumber === 1) {
            if (selectedCol1CardId === cardId) { // Deselect if clicking the same card in col1
                selectedCol1CardId = null;
                selectedCol2CardId = null;
                clearAndRenderColumn(column2El, []);
                clearAndRenderColumn(column3El, []);
            } else {
                selectedCol1CardId = cardId;
                selectedCol2CardId = null;
                const parentCard = getCard(cardId);
                clearAndRenderColumn(column2El, parentCard ? parentCard.children : []);
                clearAndRenderColumn(column3El, []);
            }
            renderCards(column1El, column1CardIds);

        } else if (columnNumber === 2) {
            if (selectedCol2CardId === cardId) {
                selectedCol2CardId = null;
                clearAndRenderColumn(column3El, []);
            } else {
                selectedCol2CardId = cardId;
                const parentCard = getCard(cardId);
                clearAndRenderColumn(column3El, parentCard ? parentCard.children : []);
            }

            if (selectedCol1CardId) {
                const col1ParentCard = getCard(selectedCol1CardId);
                renderCards(column2El, col1ParentCard ? col1ParentCard.children : []);
            } else {
                renderCards(column2El, []);
            }
        }
    }

    function clearAndRenderColumn(columnEl, cardIds) {
        const h2 = columnEl.querySelector('h2');
        columnEl.innerHTML = '';
        if (h2) columnEl.appendChild(h2);
        renderCards(columnEl, cardIds);
    }

    function handleAddCard() {
        const text = cardTextInput.value.trim();
        if (!text) {
            alert("Card text cannot be empty!");
            return;
        }

        const newCard = createCardObject(text);

        if (selectedCol2CardId !== null) {
            const parentCard = getCard(selectedCol2CardId);
            if (parentCard) {
                parentCard.children.push(newCard.id);
                renderCards(column3El, parentCard.children);
            }
        } else if (selectedCol1CardId !== null) {
            const parentCard = getCard(selectedCol1CardId);
            if (parentCard) {
                parentCard.children.push(newCard.id);
                renderCards(column2El, parentCard.children);
            }
        } else {
            column1CardIds.push(newCard.id);
            renderCards(column1El, column1CardIds);
        }
        cardTextInput.value = '';
    }

    // --- EVENT LISTENERS ---
    addCardButton.addEventListener('click', handleAddCard);
    cardTextInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleAddCard();
        }
    });

    // --- INITIALIZATION ---
    renderCards(column1El, column1CardIds);
    renderCards(column2El, []);
    renderCards(column3El, []);
});
