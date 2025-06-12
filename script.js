document.addEventListener('DOMContentLoaded', () => {
    // --- DATA ---
    let allCards = {}; // Store all cards by ID for easy lookup
    let column1CardIds = []; // IDs of cards in column 1
    let nextCardId = 1;
    let selectedCol1CardId = null;
    let selectedCol2CardId = null;
    let cachedCardStructure = null; // To store the copied card structure

    // --- DOM ELEMENTS ---
    const cardTextInput = document.getElementById('card-text-input');
    const addCardButton = document.getElementById('add-card-button');
    const column1El = document.getElementById('column-1');
    const column2El = document.getElementById('column-2');
    const column3El = document.getElementById('column-3');
    const deleteCardButton = document.getElementById('delete-card-button');
    const copyCardButton = document.getElementById('copy-card-button');
    const pasteCardButton = document.getElementById('paste-card-button');

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
    deleteCardButton.addEventListener('click', handleDeleteSelected);
    copyCardButton.addEventListener('click', handleCopySelected);
    pasteCardButton.addEventListener('click', handlePasteCachedCard);

    // --- INITIALIZATION ---
    renderCards(column1El, column1CardIds);
    renderCards(column2El, []);
    renderCards(column3El, []);


    /**
     * Recursively removes a card and all its children from the allCards data structure.
     * @param {number} cardId - The ID of the card to delete.
     */
    function deleteCardDataRecursive(cardId) {
        const card = getCard(cardId);
        if (!card) {
            return;
        }

        // Recursively delete children
        if (card.children && card.children.length > 0) {
            // Iterate over a copy of children array for safe modification
            [...card.children].forEach(childId => {
                deleteCardDataRecursive(childId);
                // The child's removal from parent's children array will be handled
                // by the caller of the top-level delete, or implicitly if parent is deleted.
            });
        }

        // Remove the card itself from the global store
        delete allCards[cardId];
    }

    /**
     * Removes a cardId from a given parent's children array.
     * @param {number} parentCardId - The ID of the parent card.
     * @param {number} cardIdToRemove - The ID of the card to remove from children.
     */
    function removeChildFromParent(parentCardId, cardIdToRemove) {
        const parentCard = getCard(parentCardId);
        if (parentCard && parentCard.children) {
            const index = parentCard.children.indexOf(cardIdToRemove);
            if (index > -1) {
                parentCard.children.splice(index, 1);
            }
        }
    }


    /**
    * Creates a deep copy of a card and its direct children's basic information (text).
    * This is a simplified version; a full recursive deep copy would be more complex.
    * @param {number} cardId - The ID of the card to copy.
    * @returns {object | null} A simplified structure of the copied card or null if not found.
    */
    function copyCardStructure(cardId) {
        const originalCard = getCard(cardId);
        if (!originalCard) {
            return null;
        }

        // Create a copy of the main card's text
        const copiedStructure = {
            text: originalCard.text,
            children: [] // We'll store simplified children here
        };

        // Copy direct children's text
        if (originalCard.children && originalCard.children.length > 0) {
            originalCard.children.forEach(childId => {
                const childCard = getCard(childId);
                if (childCard) {
                    copiedStructure.children.push({ text: childCard.text });
                    // Note: We are not copying grandchildren or their structure here.
                    // This simplifies the paste operation significantly.
                    // To copy the full subtree, this function and pasting would need to be recursive.
                }
            });
        }
        return copiedStructure;
    }

    /**
    * Handles the "Copy Selected" button click.
    */
    function handleCopySelected() {
        let cardIdToCopy = null;
        if (selectedCol2CardId !== null) {
            cardIdToCopy = selectedCol2CardId;
        } else if (selectedCol1CardId !== null) {
            cardIdToCopy = selectedCol1CardId;
        } else {
            alert("No card selected to copy.");
            return;
        }

        if (cardIdToCopy !== null) {
            cachedCardStructure = copyCardStructure(cardIdToCopy);
            if (cachedCardStructure) {
                // Simple feedback; could be a more visible UI element
                console.log("Card structure copied to cache:", cachedCardStructure);
                alert("Selected card copied!");
            } else {
                alert("Failed to copy card structure.");
            }
        }
    }

    /**
     * Handles the "Delete Selected" button click.
     */
    function handleDeleteSelected() {
        let cardIdToDelete = null;
        let parentOfDeletedCardId = null; // To help re-render the correct column
        let deletedFromColumnNumber = 0;

        if (selectedCol2CardId !== null) {
            cardIdToDelete = selectedCol2CardId;
            parentOfDeletedCardId = selectedCol1CardId; // Parent is in Col 1
            deletedFromColumnNumber = 2;
            // Remove from parent (selectedCol1CardId)'s children list
            if (selectedCol1CardId) {
                removeChildFromParent(selectedCol1CardId, cardIdToDelete);
            }
        } else if (selectedCol1CardId !== null) {
            cardIdToDelete = selectedCol1CardId;
            // No explicit parent in allCards, it's a root card for column 1
            deletedFromColumnNumber = 1;
            const index = column1CardIds.indexOf(cardIdToDelete);
            if (index > -1) {
                column1CardIds.splice(index, 1);
            }
        } else {
            alert("No card selected to delete.");
            return;
        }

        if (cardIdToDelete !== null) {
            deleteCardDataRecursive(cardIdToDelete); // Delete the card and all its descendants from allCards

            // Clear selections
            if (deletedFromColumnNumber === 1) {
                selectedCol1CardId = null;
                selectedCol2CardId = null; // Also clear col2 if col1 card is deleted
                renderCards(column1El, column1CardIds);
                clearAndRenderColumn(column2El, []);
                clearAndRenderColumn(column3El, []);
            } else if (deletedFromColumnNumber === 2) {
                selectedCol2CardId = null;
                // Re-render column 2 (children of selectedCol1CardId)
                const parentCard = getCard(parentOfDeletedCardId);
                renderCards(column2El, parentCard ? parentCard.children : []);
                clearAndRenderColumn(column3El, []); // Clear column 3
            }
        }
    }


    /**
    * Handles the "Paste Cached Card" button click.
    */
    function handlePasteCachedCard() {
        if (!cachedCardStructure) {
            alert("Nothing to paste. Copy a card first.");
            return;
        }

        // Create the main pasted card
        const newMainCard = createCardObject(cachedCardStructure.text); // createCardObject adds to allCards and returns the card

        // Determine where to paste and add children if any
        if (selectedCol2CardId !== null) { // Paste as child of selected Col2 card (into Col3)
            const parentCard = getCard(selectedCol2CardId);
            if (parentCard) {
                parentCard.children.push(newMainCard.id);
                // Add children from cache to the newMainCard (these will be in Col3, children of newMainCard)
                cachedCardStructure.children.forEach(childTextObj => {
                    const newChildCard = createCardObject(childTextObj.text);
                    newMainCard.children.push(newChildCard.id);
                });
                renderCards(column3El, parentCard.children); // Re-render Col3 showing newMainCard
            }
        } else if (selectedCol1CardId !== null) { // Paste as child of selected Col1 card (into Col2)
            const parentCard = getCard(selectedCol1CardId);
            if (parentCard) {
                parentCard.children.push(newMainCard.id);
                // Add children from cache to the newMainCard (these will be in Col2, children of newMainCard)
                cachedCardStructure.children.forEach(childTextObj => {
                    const newChildCard = createCardObject(childTextObj.text);
                    newMainCard.children.push(newChildCard.id);
                });
                renderCards(column2El, parentCard.children); // Re-render Col2 showing newMainCard
            }
        } else { // Paste into Column 1
            column1CardIds.push(newMainCard.id);
            // Add children from cache to the newMainCard
            cachedCardStructure.children.forEach(childTextObj => {
                const newChildCard = createCardObject(childTextObj.text);
                newMainCard.children.push(newChildCard.id);
            });
            renderCards(column1El, column1CardIds); // Re-render Col1
        }

        // Optional: Clear cache after paste? For now, let's allow multiple pastes.
        // cachedCardStructure = null;
        // alert("Card pasted!");
    }
});
