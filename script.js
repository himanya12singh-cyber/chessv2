 /* =====================================
   CHESS GAME
===================================== */


/* =====================================
   CHESS PIECES
===================================== */

const pieces = {

    white: {
        k: "♔",
        q: "♕",
        r: "♖",
        b: "♗",
        n: "♘",
        p: "♙"
    },

    black: {
        k: "♚",
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
        p: "♟"
    }

};


/* =====================================
   INITIAL BOARD
===================================== */

const startingBoard = [

    [
        "br", "bn", "bb", "bq",
        "bk", "bb", "bn", "br"
    ],

    [
        "bp", "bp", "bp", "bp",
        "bp", "bp", "bp", "bp"
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        "wp", "wp", "wp", "wp",
        "wp", "wp", "wp", "wp"
    ],

    [
        "wr", "wn", "wb", "wq",
        "wk", "wb", "wn", "wr"
    ]

];


/* =====================================
   GAME VARIABLES
===================================== */

let board = copyBoard(startingBoard);

let currentTurn = "w";

let selectedSquare = null;

let legalMoves = [];

let moveHistory = [];

let lastMove = null;

let gameOver = false;


/* Castling */

let castlingRights = {

    wKing: true,
    wQueen: true,

    bKing: true,
    bQueen: true

};


/* =====================================
   DOM ELEMENTS
===================================== */

const boardElement =
    document.getElementById("board");

const turnText =
    document.getElementById("turnText");

const statusText =
    document.getElementById("statusText");

const moveHistoryElement =
    document.getElementById("moveHistory");

const restartBtn =
    document.getElementById("restartBtn");

const newGameBtn =
    document.getElementById("newGameBtn");

const promotionModal =
    document.getElementById("promotionModal");


/* =====================================
   START GAME
===================================== */

renderBoard();


/* =====================================
   COPY BOARD
===================================== */

function copyBoard(board) {

    return board.map(row => [...row]);

}


/* =====================================
   RENDER BOARD
===================================== */

function renderBoard() {

    boardElement.innerHTML = "";


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const square =
                document.createElement("div");

            square.classList.add("square");


            /* Board colors */

            if ((row + col) % 2 === 0) {

                square.classList.add("light");

            } else {

                square.classList.add("dark");

            }


            /* Last move */

            if (
                lastMove &&
                (
                    sameSquare(lastMove.from, { row, col }) ||
                    sameSquare(lastMove.to, { row, col })
                )
            ) {

                square.classList.add("last-move");

            }


            /* Selected square */

            if (
                selectedSquare &&
                sameSquare(
                    selectedSquare,
                    { row, col }
                )
            ) {

                square.classList.add("selected");

            }


            /* Legal move */

            const isLegal =
                legalMoves.some(move =>
                    move.row === row &&
                    move.col === col
                );


            if (isLegal) {

                if (board[row][col]) {

                    square.classList.add(
                        "capture-move"
                    );

                } else {

                    square.classList.add(
                        "legal-move"
                    );

                }

            }


            /* Piece */

            const piece =
                board[row][col];


            if (piece) {

                const color =
                    piece[0];

                const type =
                    piece[1];

                const pieceElement =
                    document.createElement("span");

                pieceElement.classList.add("piece");

                pieceElement.textContent =
                    pieces[
                        color === "w"
                            ? "white"
                            : "black"
                    ][type];

                square.appendChild(pieceElement);

            }


            /* Click */

            square.addEventListener(
                "click",
                () => handleSquareClick(row, col)
            );


            boardElement.appendChild(square);

        }

    }


    highlightKingInCheck();

}


/* =====================================
   HANDLE SQUARE CLICK
===================================== */

function handleSquareClick(row, col) {

    if (gameOver) {
        return;
    }


    const clickedPiece =
        board[row][col];


    /* =================================
       MOVE SELECTED PIECE
    ================================= */

    if (selectedSquare) {

        const chosenMove =
            legalMoves.find(move =>
                move.row === row &&
                move.col === col
            );


        if (chosenMove) {

            makeMove(
                selectedSquare,
                chosenMove
            );

            return;

        }

    }


    /* =================================
       SELECT A PIECE
    ================================= */

    if (
        clickedPiece &&
        clickedPiece[0] === currentTurn
    ) {

        selectedSquare = {
            row,
            col
        };


        legalMoves =
            getLegalMoves(
                row,
                col,
                board
            );


        renderBoard();

        return;

    }


    /* =================================
       CLICK EMPTY SQUARE
    ================================= */

    selectedSquare = null;

    legalMoves = [];

    renderBoard();

}


/* =====================================
   MAKE MOVE
===================================== */

function makeMove(from, to) {

    const movingPiece =
        board[from.row][from.col];

    const capturedPiece =
        board[to.row][to.col];


    /* Save board before move */

    const boardBefore =
        copyBoard(board);


    /* Move */

    board[to.row][to.col] =
        movingPiece;

    board[from.row][from.col] =
        null;


    /* Update castling rights */

    updateCastlingRights(
        movingPiece,
        from,
        to,
        capturedPiece
    );


    /* Castling */

    if (
        movingPiece[1] === "k" &&
        Math.abs(to.col - from.col) === 2
    ) {

        moveRookForCastle(
            from,
            to
        );

    }


    /* Promotion */

    if (
        movingPiece[1] === "p" &&
        (
            to.row === 0 ||
            to.row === 7
        )
    ) {

        selectedSquare = null;

        legalMoves = [];

        renderBoard();

        showPromotion(
            to,
            movingPiece[0]
        );

        return;

    }


    finishMove(
        from,
        to,
        boardBefore
    );

}


/* =====================================
   FINISH MOVE
===================================== */

function finishMove(
    from,
    to,
    boardBefore
) {

    lastMove = {
        from,
        to
    };


    const notation =
        createMoveNotation(
            from,
            to
        );


    moveHistory.push({
        color: currentTurn,
        notation
    });


    currentTurn =
        currentTurn === "w"
            ? "b"
            : "w";


    selectedSquare = null;

    legalMoves = [];


    updateMoveHistory();


    checkGameStatus();


    renderBoard();

}


/* =====================================
   MOVE NOTATION
===================================== */

function createMoveNotation(from, to) {

    const files =
        ["a", "b", "c", "d", "e", "f", "g", "h"];

    const fromSquare =
        files[from.col] +
        (8 - from.row);

    const toSquare =
        files[to.col] +
        (8 - to.row);

    return fromSquare + "-" + toSquare;

}


/* =====================================
   GET LEGAL MOVES
===================================== */

function getLegalMoves(
    row,
    col,
    currentBoard
) {

    const piece =
        currentBoard[row][col];


    if (!piece) {
        return [];
    }


    const pseudoMoves =
        getPseudoMoves(
            row,
            col,
            currentBoard,
            true
        );


    const legal = [];


    for (const move of pseudoMoves) {

        const testBoard =
            copyBoard(currentBoard);


        const movingPiece =
            testBoard[row][col];


        testBoard[move.row][move.col] =
            movingPiece;

        testBoard[row][col] =
            null;


        /* Test castling rook */

        if (
            movingPiece[1] === "k" &&
            Math.abs(move.col - col) === 2
        ) {

            if (move.col === 6) {

                testBoard[row][5] =
                    testBoard[row][7];

                testBoard[row][7] =
                    null;

            }

            if (move.col === 2) {

                testBoard[row][3] =
                    testBoard[row][0];

                testBoard[row][0] =
                    null;

            }

        }


        const kingSquare =
            findKing(
                movingPiece[0],
                testBoard
            );


        if (
            kingSquare &&
            !isSquareAttacked(
                kingSquare.row,
                kingSquare.col,
                oppositeColor(movingPiece[0]),
                testBoard
            )
        ) {

            legal.push(move);

        }

    }


    return legal;

}


/* =====================================
   GET BASIC / PSEUDO MOVES
===================================== */

function getPseudoMoves(
    row,
    col,
    currentBoard,
    includeCastling
) {

    const piece =
        currentBoard[row][col];


    if (!piece) {
        return [];
    }


    const color =
        piece[0];

    const type =
        piece[1];


    const moves = [];


    /* =================================
       PAWN
    ================================= */

    if (type === "p") {

        const direction =
            color === "w"
                ? -1
                : 1;


        const startRow =
            color === "w"
                ? 6
                : 1;


        /* One square */

        const oneRow =
            row + direction;


        if (
            insideBoard(oneRow, col) &&
            !currentBoard[oneRow][col]
        ) {

            moves.push({
                row: oneRow,
                col
            });


            /* Two squares */

            const twoRow =
                row + direction * 2;


            if (
                row === startRow &&
                !currentBoard[twoRow][col]
            ) {

                moves.push({
                    row: twoRow,
                    col
                });

            }

        }


        /* Captures */

        for (const dc of [-1, 1]) {

            const captureRow =
                row + direction;

            const captureCol =
                col + dc;


            if (
                insideBoard(
                    captureRow,
                    captureCol
                )
            ) {

                const target =
                    currentBoard[
                        captureRow
                    ][
                        captureCol
                    ];


                if (
                    target &&
                    target[0] !== color
                ) {

                    moves.push({
                        row: captureRow,
                        col: captureCol
                    });

                }

            }

        }

    }


    /* =================================
       KNIGHT
    ================================= */

    if (type === "n") {

        const knightMoves = [

            [-2, -1],
            [-2, 1],

            [-1, -2],
            [-1, 2],

            [1, -2],
            [1, 2],

            [2, -1],
            [2, 1]

        ];


        for (const [dr, dc] of knightMoves) {

            addMoveIfValid(
                row,
                col,
                row + dr,
                col + dc,
                color,
                currentBoard,
                moves
            );

        }

    }


    /* =================================
       BISHOP
    ================================= */

    if (type === "b") {

        const directions = [

            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1]

        ];


        addSlidingMoves(
            row,
            col,
            color,
            currentBoard,
            directions,
            moves
        );

    }


    /* =================================
       ROOK
    ================================= */

    if (type === "r") {

        const directions = [

            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]

        ];


        addSlidingMoves(
            row,
            col,
            color,
            currentBoard,
            directions,
            moves
        );

    }


    /* =================================
       QUEEN
    ================================= */

    if (type === "q") {

        const directions = [

            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],

            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]

        ];


        addSlidingMoves(
            row,
            col,
            color,
            currentBoard,
            directions,
            moves
        );

    }


    /* =================================
       KING
    ================================= */

    if (type === "k") {

        const kingMoves = [

            [-1, -1],
            [-1, 0],
            [-1, 1],

            [0, -1],
            [0, 1],

            [1, -1],
            [1, 0],
            [1, 1]

        ];


        for (const [dr, dc] of kingMoves) {

            addMoveIfValid(
                row,
                col,
                row + dr,
                col + dc,
                color,
                currentBoard,
                moves
            );

        }


        /* Castling */

        if (includeCastling) {

            addCastlingMoves(
                row,
                col,
                color,
                currentBoard,
                moves
            );

        }

    }


    return moves;

}


/* =====================================
   ADD NORMAL MOVE
===================================== */

function addMoveIfValid(
    row,
    col,
    newRow,
    newCol,
    color,
    currentBoard,
    moves
) {

    if (
        !insideBoard(
            newRow,
            newCol
        )
    ) {

        return;

    }


    const target =
        currentBoard[newRow][newCol];


    if (
        !target ||
        target[0] !== color
    ) {

        moves.push({
            row: newRow,
            col: newCol
        });

    }

}


/* =====================================
   SLIDING PIECES
===================================== */

function addSlidingMoves(
    row,
    col,
    color,
    currentBoard,
    directions,
    moves
) {

    for (const [dr, dc] of directions) {

        let newRow =
            row + dr;

        let newCol =
            col + dc;


        while (
            insideBoard(
                newRow,
                newCol
            )
        ) {

            const target =
                currentBoard[newRow][newCol];


            if (!target) {

                moves.push({
                    row: newRow,
                    col: newCol
                });

            } else {

                if (target[0] !== color) {

                    moves.push({
                        row: newRow,
                        col: newCol
                    });

                }

                break;

            }


            newRow += dr;
            newCol += dc;

        }

    }

}


/* =====================================
   CASTLING
===================================== */

function addCastlingMoves(
    row,
    col,
    color,
    currentBoard,
    moves
) {

    const kingRow =
        color === "w"
            ? 7
            : 0;


    if (row !== kingRow || col !== 4) {
        return;
    }


    const enemy =
        oppositeColor(color);


    /* King must not currently be in check */

    if (
        isSquareAttacked(
            row,
            col,
            enemy,
            currentBoard
        )
    ) {

        return;

    }


    /* =================================
       KING SIDE
    ================================= */

    const kingSideAllowed =
        color === "w"
            ? castlingRights.wKing
            : castlingRights.bKing;


    if (
        kingSideAllowed &&
        currentBoard[row][5] === null &&
        currentBoard[row][6] === null &&
        currentBoard[row][7] ===
            color + "r" &&
        !isSquareAttacked(
            row,
            5,
            enemy,
            currentBoard
        ) &&
        !isSquareAttacked(
            row,
            6,
            enemy,
            currentBoard
        )
    ) {

        moves.push({
            row,
            col: 6
        });

    }


    /* =================================
       QUEEN SIDE
    ================================= */

    const queenSideAllowed =
        color === "w"
            ? castlingRights.wQueen
            : castlingRights.bQueen;


    if (
        queenSideAllowed &&
        currentBoard[row][1] === null &&
        currentBoard[row][2] === null &&
        currentBoard[row][3] === null &&
        currentBoard[row][0] ===
            color + "r" &&
        !isSquareAttacked(
            row,
            3,
            enemy,
            currentBoard
        ) &&
        !isSquareAttacked(
            row,
            2,
            enemy,
            currentBoard
        )
    ) {

        moves.push({
            row,
            col: 2
        });

    }

}


/* =====================================
   ATTACK DETECTION
===================================== */

function isSquareAttacked(
    row,
    col,
    attackerColor,
    currentBoard
) {

    for (let r = 0; r < 8; r++) {

        for (let c = 0; c < 8; c++) {

            const piece =
                currentBoard[r][c];


            if (
                piece &&
                piece[0] === attackerColor
            ) {

                const type =
                    piece[1];


                /* Pawn */

                if (type === "p") {

                    const direction =
                        attackerColor === "w"
                            ? -1
                            : 1;


                    if (
                        r + direction === row &&
                        Math.abs(c - col) === 1
                    ) {

                        return true;

                    }

                }


                /* Knight */

                if (type === "n") {

                    const dr =
                        Math.abs(r - row);

                    const dc =
                        Math.abs(c - col);


                    if (
                        (dr === 2 && dc === 1) ||
                        (dr === 1 && dc === 2)
                    ) {

                        return true;

                    }

                }


                /* King */

                if (type === "k") {

                    if (
                        Math.max(
                            Math.abs(r - row),
                            Math.abs(c - col)
                        ) === 1
                    ) {

                        return true;

                    }

                }


                /* Sliding pieces */

                if (
                    type === "r" ||
                    type === "b" ||
                    type === "q"
                ) {

                    if (
                        piecesAttackSquare(
                            r,
                            c,
                            row,
                            col,
                            type,
                            currentBoard
                        )
                    ) {

                        return true;

                    }

                }

            }

        }

    }


    return false;

}


/* =====================================
   SLIDING ATTACK
===================================== */

function piecesAttackSquare(
    fromRow,
    fromCol,
    targetRow,
    targetCol,
    type,
    currentBoard
) {

    const rowDifference =
        targetRow - fromRow;

    const colDifference =
        targetCol - fromCol;


    const isStraight =
        rowDifference === 0 ||
        colDifference === 0;


    const isDiagonal =
        Math.abs(rowDifference) ===
        Math.abs(colDifference);


    if (type === "r" && !isStraight) {
        return false;
    }


    if (type === "b" && !isDiagonal) {
        return false;
    }


    if (
        type === "q" &&
        !isStraight &&
        !isDiagonal
    ) {

        return false;

    }


    const rowStep =
        Math.sign(rowDifference);

    const colStep =
        Math.sign(colDifference);


    let r =
        fromRow + rowStep;

    let c =
        fromCol + colStep;


    while (
        r !== targetRow ||
        c !== targetCol
    ) {

        if (currentBoard[r][c]) {
            return false;
        }

        r += rowStep;
        c += colStep;

    }


    return true;

}


/* =====================================
   FIND KING
===================================== */

function findKing(
    color,
    currentBoard
) {

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            if (
                currentBoard[row][col] ===
                color + "k"
            ) {

                return {
                    row,
                    col
                };

            }

        }

    }


    return null;

}


/* =====================================
   OPPOSITE COLOR
===================================== */

function oppositeColor(color) {

    return color === "w"
        ? "b"
        : "w";

}


/* =====================================
   BOARD CHECK
===================================== */

function insideBoard(row, col) {

    return (
        row >= 0 &&
        row < 8 &&
        col >= 0 &&
        col < 8
    );

}


/* =====================================
   SAME SQUARE
===================================== */

function sameSquare(a, b) {

    return (
        a.row === b.row &&
        a.col === b.col
    );

}


/* =====================================
   UPDATE CASTLING RIGHTS
===================================== */

function updateCastlingRights(
    piece,
    from,
    to,
    capturedPiece
) {

    const color =
        piece[0];


    const type =
        piece[1];


    /* King moved */

    if (type === "k") {

        if (color === "w") {

            castlingRights.wKing = false;
            castlingRights.wQueen = false;

        } else {

            castlingRights.bKing = false;
            castlingRights.bQueen = false;

        }

    }


    /* Rook moved */

    if (
        type === "r" &&
        color === "w"
    ) {

        if (from.row === 7 && from.col === 0) {
            castlingRights.wQueen = false;
        }

        if (from.row === 7 && from.col === 7) {
            castlingRights.wKing = false;
        }

    }


    if (
        type === "r" &&
        color === "b"
    ) {

        if (from.row === 0 && from.col === 0) {
            castlingRights.bQueen = false;
        }

        if (from.row === 0 && from.col === 7) {
            castlingRights.bKing = false;
        }

    }


    /* Rook captured */

    if (
        capturedPiece === "wr"
    ) {

        if (to.row === 7 && to.col === 0) {
            castlingRights.wQueen = false;
        }

        if (to.row === 7 && to.col === 7) {
            castlingRights.wKing = false;
        }

    }


    if (
        capturedPiece === "br"
    ) {

        if (to.row === 0 && to.col === 0) {
            castlingRights.bQueen = false;
        }

        if (to.row === 0 && to.col === 7) {
            castlingRights.bKing = false;
        }

    }

}


/* =====================================
   MOVE ROOK DURING CASTLING
===================================== */

function moveRookForCastle(
    from,
    to
) {

    const row =
        from.row;


    /* King side */

    if (to.col === 6) {

        board[row][5] =
            board[row][7];

        board[row][7] =
            null;

    }


    /* Queen side */

    if (to.col === 2) {

        board[row][3] =
            board[row][0];

        board[row][0] =
            null;

    }

}


/* =====================================
   CHECK GAME STATUS
===================================== */

function checkGameStatus() {

    const kingSquare =
        findKing(
            currentTurn,
            board
        );


    const inCheck =
        kingSquare &&
        isSquareAttacked(
            kingSquare.row,
            kingSquare.col,
            oppositeColor(currentTurn),
            board
        );


    const hasMoves =
        playerHasLegalMoves(
            currentTurn
        );


    if (!hasMoves && inCheck) {

        gameOver = true;

        statusText.textContent =
            currentTurn === "w"
                ? "Checkmate — Black wins!"
                : "Checkmate — White wins!";

        turnText.textContent =
            "Game Over";

        return;

    }


    if (!hasMoves && !inCheck) {

        gameOver = true;

        statusText.textContent =
            "Draw — Stalemate";

        turnText.textContent =
            "Game Over";

        return;

    }


    if (inCheck) {

        statusText.textContent =
            "Check!";

    } else {

        statusText.textContent =
            "Game in progress";

    }


    turnText.textContent =
        currentTurn === "w"
            ? "White's turn"
            : "Black's turn";

}


/* =====================================
   PLAYER HAS LEGAL MOVES
===================================== */

function playerHasLegalMoves(color) {

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                board[row][col];


            if (
                piece &&
                piece[0] === color
            ) {

                const moves =
                    getLegalMoves(
                        row,
                        col,
                        board
                    );


                if (moves.length > 0) {

                    return true;

                }

            }

        }

    }


    return false;

}


/* =====================================
   HIGHLIGHT KING IN CHECK
===================================== */

function highlightKingInCheck() {

    const king =
        findKing(
            currentTurn,
            board
        );


    if (!king) {
        return;
    }


    if (
        isSquareAttacked(
            king.row,
            king.col,
            oppositeColor(currentTurn),
            board
        )
    ) {

        const index =
            king.row * 8 +
            king.col;


        const square =
            boardElement.children[index];


        if (square) {

            square.classList.add(
                "in-check"
            );

        }

    }

}


/* =====================================
   MOVE HISTORY
===================================== */

function updateMoveHistory() {

    if (moveHistory.length === 0) {

        moveHistoryElement.innerHTML =
            '<p class="empty-history">No moves yet</p>';

        return;

    }


    moveHistoryElement.innerHTML = "";


    for (
        let i = 0;
        i < moveHistory.length;
        i += 2
    ) {

        const row =
            document.createElement("div");

        row.classList.add("move-row");


        const number =
            document.createElement("span");

        number.classList.add(
            "move-number"
        );

        number.textContent =
            (i / 2 + 1) + ".";


        const whiteMove =
            document.createElement("span");

        whiteMove.textContent =
            moveHistory[i]
                ? moveHistory[i].notation
                : "";


        const blackMove =
            document.createElement("span");

        blackMove.textContent =
            moveHistory[i + 1]
                ? moveHistory[i + 1].notation
                : "";


        row.appendChild(number);

        row.appendChild(whiteMove);

        row.appendChild(blackMove);


        moveHistoryElement.appendChild(row);

    }


    moveHistoryElement.scrollTop =
        moveHistoryElement.scrollHeight;

}


/* =====================================
   PROMOTION
===================================== */

let promotionSquare = null;

let promotionColor = null;


function showPromotion(
    square,
    color
) {

    promotionSquare = square;

    promotionColor = color;

    promotionModal.classList.remove(
        "hidden"
    );

}


/* Promotion buttons */

document
    .querySelectorAll(
        ".promotion-options button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset.piece;


                board[
                    promotionSquare.row
                ][
                    promotionSquare.col
                ] =
                    promotionColor + type;


                promotionModal.classList.add(
                    "hidden"
                );


                const from =
                    lastMove
                        ? lastMove.from
                        : null;


                const to =
                    promotionSquare;


                currentTurn =
                    currentTurn === "w"
                        ? "b"
                        : "w";


                selectedSquare = null;

                legalMoves = [];


                updateMoveHistory();

                checkGameStatus();

                renderBoard();

            }
        );

    });


/* =====================================
   RESTART GAME
===================================== */

function restartGame() {

    board =
        copyBoard(startingBoard);

    currentTurn = "w";

    selectedSquare = null;

    legalMoves = [];

    moveHistory = [];

    lastMove = null;

    gameOver = false;


    castlingRights = {

        wKing: true,
        wQueen: true,

        bKing: true,
        bQueen: true

    };


    statusText.textContent =
        "Game in progress";

    turnText.textContent =
        "White's turn";


    updateMoveHistory();

    renderBoard();

}


restartBtn.addEventListener(
    "click",
    restartGame
);


newGameBtn.addEventListener(
    "click",
    restartGame
);


/* =====================================
   DIFFICULTY BUTTONS
===================================== */

const difficultyButtons =
    document.querySelectorAll(
        ".difficulty-btn"
    );


difficultyButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            difficultyButtons.forEach(
                btn =>
                    btn.classList.remove(
                        "active"
                    )
            );


            button.classList.add(
                "active"
            );

        }
    );

});
