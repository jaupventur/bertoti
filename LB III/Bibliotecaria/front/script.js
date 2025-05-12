// URL base para a API - ajuste conforme necessário
const API_URL = 'http://localhost:8080';

// Elementos DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicialização
    setupNavigation();
    fetchBooks();
    setupEventListeners();
});

// Configuração da navegação entre abas
function setupNavigation() {
    const buttons = document.querySelectorAll('#buttons button');
    const tabs = document.querySelectorAll('.tab');

    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove classe 'active' de todos os botões e abas
            buttons.forEach(btn => btn.classList.remove('active'));
            tabs.forEach(tab => tab.classList.remove('active'));

            // Adiciona classe 'active' ao botão clicado
            this.classList.add('active');

            // Ativa a aba correspondente
            const tabId = this.id.replace('-button', '-tab');
            document.getElementById(tabId).classList.add('active');

            // Atualiza conteúdo específico das abas
            if (this.id === 'list-button') {
                fetchBooks();
            } else if (this.id === 'edit-button') {
                loadBooksForEdit();
            } else if (this.id === 'delete-button') {
                loadBooksForDelete();
            } else if (this.id === 'reserve-button') {
                loadBooksForReserve();
                loadActiveReservations();
            } else if (this.id === 'return-button') {
                loadReservationsForReturn();
                loadReturnHistory();
            }
        });
    });
}

// Configuração dos event listeners para formulários e botões
function setupEventListeners() {
    // Botão de busca
    document.getElementById('search-button').addEventListener('click', searchBooks);
    document.getElementById('clear-search').addEventListener('click', clearSearch);

    // Cadastro de livro
    document.getElementById('create-submit').addEventListener('click', createBook);

    // Edição de livro
    document.getElementById('edit-select').addEventListener('change', loadBookDetails);
    document.getElementById('edit-submit').addEventListener('click', updateBook);

    // Remoção de livro
    document.getElementById('delete-submit').addEventListener('click', deleteBook);

    // Reserva de livro
    document.getElementById('reserve-submit').addEventListener('click', createReservation);
    document.getElementById('search-reservation-button').addEventListener('click', searchReservations);

    // Devolução de livro
    document.getElementById('return-reservation').addEventListener('change', loadReservationDetails);
    document.getElementById('return-submit').addEventListener('click', returnBook);
    document.getElementById('cancel-reservation').addEventListener('click', cancelReservation);
}

// Funções para manipulação de livros
async function fetchBooks() {
    try {
        const response = await fetch(`${API_URL}/livros`);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        showError('Erro ao carregar livros', error);
    }
}

function displayBooks(books) {
    const listContent = document.getElementById('list-content');
    listContent.innerHTML = '';

    if (books.length === 0) {
        listContent.innerHTML = '<p class="empty-message">Nenhum livro encontrado.</p>';
        return;
    }

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // Formatação da data
        const publicationDate = new Date(book.publicacao);
        const formattedDate = publicationDate.toLocaleDateString('pt-BR');
        
        bookCard.innerHTML = `
            <h3>${book.titulo}</h3>
            <p><strong>Autor:</strong> ${book.autor}</p>
            <p><strong>Gênero:</strong> ${book.genero}</p>
            <p><strong>Publicação:</strong> ${formattedDate}</p>
            <div class="book-status ${book.quantidadeDisponivel > 0 ? '' : 'unavailable'}">
                <p><strong>Disponíveis:</strong> ${book.quantidadeDisponivel} exemplar(es)</p>
            </div>
        `;
        listContent.appendChild(bookCard);
    });
}

async function searchBooks() {
    const titulo = document.getElementById('search-title').value;
    const autor = document.getElementById('search-author').value;
    const genero = document.getElementById('search-genre').value;

    let url = `${API_URL}/livros/busca?`;
    if (titulo) url += `titulo=${encodeURIComponent(titulo)}&`;
    if (autor) url += `autor=${encodeURIComponent(autor)}&`;
    if (genero) url += `genero=${encodeURIComponent(genero)}&`;

    try {
        const response = await fetch(url);
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        showError('Erro na busca de livros', error);
    }
}

function clearSearch() {
    document.getElementById('search-title').value = '';
    document.getElementById('search-author').value = '';
    document.getElementById('search-genre').value = '';
    fetchBooks();
}

async function createBook() {
    const titulo = document.getElementById('create-title').value;
    const autor = document.getElementById('create-author').value;
    const genero = document.getElementById('create-genre').value;
    const publicacao = document.getElementById('create-publication').value;
    const quantidade = document.getElementById('create-quantity').value;

    // Validação básica
    if (!titulo || !autor || !genero || !publicacao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Formata a data para o formato esperado pelo backend (yyyy-MM-dd)
    const formattedDate = new Date(publicacao).toISOString().split('T')[0];

    const newBook = {
        titulo: titulo,
        autor: autor,
        genero: genero,
        publicacao: publicacao, // O backend deverá converter para Date
        quantidadeDisponivel: parseInt(quantidade)
    };

    try {
        const response = await fetch(`${API_URL}/livros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newBook)
        });

        if (response.ok) {
            alert('Livro cadastrado com sucesso!');
            // Limpa o formulário
            document.getElementById('create-title').value = '';
            document.getElementById('create-author').value = '';
            document.getElementById('create-genre').value = '';
            document.getElementById('create-publication').value = '';
            document.getElementById('create-quantity').value = '1';
            
            // Atualiza listagem
            fetchBooks();
        } else {
            const error = await response.text();
            throw new Error(error);
        }
    } catch (error) {
        showError('Erro ao cadastrar livro', error);
    }
}

async function loadBooksForEdit() {
    try {
        const response = await fetch(`${API_URL}/livros`);
        const books = await response.json();
        
        const select = document.getElementById('edit-select');
        select.innerHTML = '<option value="">Selecione um livro</option>';
        
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.titulo} - ${book.autor}`;
            select.appendChild(option);
        });
    } catch (error) {
        showError('Erro ao carregar livros para edição', error);
    }
}

async function loadBookDetails() {
    const bookId = document.getElementById('edit-select').value;
    
    if (!bookId) {
        // Limpa os campos se nenhum livro for selecionado
        document.getElementById('edit-title').value = '';
        document.getElementById('edit-author').value = '';
        document.getElementById('edit-genre').value = '';
        document.getElementById('edit-publication').value = '';
        document.getElementById('edit-quantity').value = '';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/livros/${bookId}`);
        const book = await response.json();
        
        // Formata a data para o formato HTML date input (yyyy-MM-dd)
        const pubDate = new Date(book.publicacao);
        const formattedDate = pubDate.toISOString().split('T')[0];
        
        document.getElementById('edit-title').value = book.titulo;
        document.getElementById('edit-author').value = book.autor;
        document.getElementById('edit-genre').value = book.genero;
        document.getElementById('edit-publication').value = formattedDate;
        document.getElementById('edit-quantity').value = book.quantidadeDisponivel;
    } catch (error) {
        showError('Erro ao carregar detalhes do livro', error);
    }
}

async function updateBook() {
    const bookId = document.getElementById('edit-select').value;
    
    if (!bookId) {
        alert('Por favor, selecione um livro para editar.');
        return;
    }
    
    const titulo = document.getElementById('edit-title').value;
    const autor = document.getElementById('edit-author').value;
    const genero = document.getElementById('edit-genre').value;
    const publicacao = document.getElementById('edit-publication').value;
    const quantidade = document.getElementById('edit-quantity').value;
    
    // Validação básica
    if (!titulo || !autor || !genero || !publicacao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const updatedBook = {
        id: bookId,
        titulo: titulo,
        autor: autor,
        genero: genero,
        publicacao: publicacao,
        quantidadeDisponivel: parseInt(quantidade)
    };
    
    try {
        const response = await fetch(`${API_URL}/livros/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedBook)
        });
        
        if (response.ok) {
            alert('Livro atualizado com sucesso!');
            // Recarrega a lista de livros
            loadBooksForEdit();
        } else {
            const error = await response.text();
            throw new Error(error);
        }
    } catch (error) {
        showError('Erro ao atualizar livro', error);
    }
}

async function loadBooksForDelete() {
    try {
        const response = await fetch(`${API_URL}/livros`);
        const books = await response.json();
        
        const select = document.getElementById('delete-select');
        select.innerHTML = '<option value="">Selecione um livro</option>';
        
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.titulo} - ${book.autor}`;
            select.appendChild(option);
        });
    } catch (error) {
        showError('Erro ao carregar livros para exclusão', error);
    }
}

async function deleteBook() {
    const bookId = document.getElementById('delete-select').value;
    
    if (!bookId) {
        alert('Por favor, selecione um livro para remover.');
        return;
    }
    
    if (!confirm('Tem certeza que deseja remover este livro? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/livros/${bookId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Livro removido com sucesso!');
            // Recarrega a lista de livros
            loadBooksForDelete();
        } else if (response.status === 409) {
            alert('Este livro não pode ser removido pois possui reservas ativas.');
        } else {
            const error = await response.text();
            throw new Error(error);
        }
    } catch (error) {
        showError('Erro ao remover livro', error);
    }
}

// Funções para manipulação de reservas
async function loadBooksForReserve() {
    try {
        const response = await fetch(`${API_URL}/livros`);
        const books = await response.json();
        
        const select = document.getElementById('reserve-book');
        select.innerHTML = '<option value="">Selecione um livro</option>';
        
        books.forEach(book => {
            // Só adiciona livros que têm exemplares disponíveis
            if (book.quantidadeDisponivel > 0) {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = `${book.titulo} - ${book.autor} (${book.quantidadeDisponivel} disponíveis)`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        showError('Erro ao carregar livros para reserva', error);
    }
}

async function createReservation() {
    const livroId = document.getElementById('reserve-book').value;
    const nome = document.getElementById('reserve-user-name').value;
    const email = document.getElementById('reserve-user-email').value;
    const telefone = document.getElementById('reserve-user-phone').value;
    
    // Validação básica
    if (!livroId || !nome) {
        alert('Por favor, selecione um livro e informe o nome do usuário.');
        return;
    }
    
    const usuario = {
        nome: nome,
        email: email,
        telefone: telefone
    };
    
    try {
        const response = await fetch(`${API_URL}/livros/${livroId}/reservar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuario)
        });
        
        if (response.ok) {
            alert('Reserva realizada com sucesso!');
            // Limpa o formulário
            document.getElementById('reserve-book').value = '';
            document.getElementById('reserve-user-name').value = '';
            document.getElementById('reserve-user-email').value = '';
            document.getElementById('reserve-user-phone').value = '';
            
            // Atualiza a lista de reservas ativas
            loadActiveReservations();
            // Recarrega os livros disponíveis para reserva
            loadBooksForReserve();
        } else if (response.status === 409) {
            alert('Não há exemplares disponíveis para reserva.');
        } else {
            const error = await response.text();
            throw new Error(error);
        }
    } catch (error) {
        showError('Erro ao criar reserva', error);
    }
}

async function loadActiveReservations() {
    try {
        const response = await fetch(`${API_URL}/livros/reservas`);
        const reservations = await response.json();
        
        const reservationsList = document.getElementById('active-reservations');
        reservationsList.innerHTML = '';
        
        // Filtra apenas reservas ativas (não canceladas e não devolvidas)
        const activeReservations = reservations.filter(r => !r.cancelada && !r.devolvida);
        
        if (activeReservations.length === 0) {
            reservationsList.innerHTML = '<p class="empty-message">Nenhuma reserva ativa no momento.</p>';
            return;
        }
        
        // Para cada reserva, busca informações do livro
        for (const reservation of activeReservations) {
            try {
                const bookResponse = await fetch(`${API_URL}/livros/${reservation.livroId}`);
                const book = await bookResponse.json();
                
                const reservationItem = document.createElement('div');
                reservationItem.className = 'reservation-item';
                
                // Formatação das datas
                const reservaDate = new Date(reservation.dataReserva);
                const devolucaoDate = new Date(reservation.dataPrevistaDevolucao);
                
                reservationItem.innerHTML = `
                    <h4>${book.titulo}</h4>
                    <p><strong>Usuário:</strong> ${reservation.nomeUsuario}</p>
                    <p><strong>Data da Reserva:</strong> ${reservaDate.toLocaleDateString('pt-BR')}</p>
                    <p><strong>Devolução Prevista:</strong> ${devolucaoDate.toLocaleDateString('pt-BR')}</p>
                    <div class="reservation-actions">
                        <button class="action-button" onclick="returnBook('${reservation.id}')">Devolver</button>
                        <button class="action-button secondary" onclick="cancelReservation('${reservation.id}')">Cancelar</button>
                    </div>
                `;
                
                reservationsList.appendChild(reservationItem);
            } catch (bookError) {
                console.error('Erro ao buscar detalhes do livro:', bookError);
            }
        }
    } catch (error) {
        showError('Erro ao carregar reservas ativas', error);
    }
}

async function searchReservations() {
    const searchTerm = document.getElementById('search-reservation').value.toLowerCase();
    
    try {
        const response = await fetch(`${API_URL}/livros/reservas`);
        const reservations = await response.json();
        
        // Filtra reservas pelo nome do usuário
        const filteredReservations = reservations.filter(r => 
            !r.cancelada && 
            !r.devolvida && 
            r.nomeUsuario.toLowerCase().includes(searchTerm)
        );
        
        const reservationsList = document.getElementById('active-reservations');
        reservationsList.innerHTML = '';
        
        if (filteredReservations.length === 0) {
            reservationsList.innerHTML = '<p class="empty-message">Nenhuma reserva encontrada.</p>';
            return;
        }
        
        // Para cada reserva, busca informações do livro
        for (const reservation of filteredReservations) {
            try {
                const bookResponse = await fetch(`${API_URL}/livros/${reservation.livroId}`);
                const book = await bookResponse.json();
                
                const reservationItem = document.createElement('div');
                reservationItem.className = 'reservation-item';
                
                // Formatação das datas
                const reservaDate = new Date(reservation.dataReserva);
                const devolucaoDate = new Date(reservation.dataPrevistaDevolucao);
                
                reservationItem.innerHTML = `
                    <h4>${book.titulo}</h4>
                    <p><strong>Usuário:</strong> ${reservation.nomeUsuario}</p>
                    <p><strong>Data da Reserva:</strong> ${reservaDate.toLocaleDateString('pt-BR')}</p>
                    <p><strong>Devolução Prevista:</strong> ${devolucaoDate.toLocaleDateString('pt-BR')}</p>
                    <div class="reservation-actions">
                        <button class="action-button" onclick="returnBook('${reservation.id}')">Devolver</button>
                        <button class="action-button secondary" onclick="cancelReservation('${reservation.id}')">Cancelar</button>
                    </div>
                `;
                
                reservationsList.appendChild(reservationItem);
            } catch (bookError) {
                console.error('Erro ao buscar detalhes do livro:', bookError);
            }
        }
    } catch (error) {
        showError('Erro ao buscar reservas', error);
    }
}

async function loadReservationsForReturn() {
    try {
        const response = await fetch(`${API_URL}/livros/reservas`);
        const reservations = await response.json();
        
        const select = document.getElementById('return-reservation');
        select.innerHTML = '<option value="">Selecione uma reserva</option>';
        
        // Filtra apenas reservas ativas
        const activeReservations = reservations.filter(r => !r.cancelada && !r.devolvida);
        
        for (const reservation of activeReservations) {
            try {
                const bookResponse = await fetch(`${API_URL}/livros/${reservation.livroId}`);
                const book = await bookResponse.json();
                
                const option = document.createElement('option');
                option.value = reservation.id;
                option.textContent = `${book.titulo} - ${reservation.nomeUsuario}`;
                select.appendChild(option);
            } catch (bookError) {
                console.error('Erro ao buscar detalhes do livro:', bookError);
            }
        }
    } catch (error) {
        showError('Erro ao carregar reservas para devolução', error);
    }
}

async function loadReservationDetails() {
    const reservationId = document.getElementById('return-reservation').value;
    
    if (!reservationId) {
        // Limpa os detalhes
        document.getElementById('return-book-title').textContent = '--';
        document.getElementById('return-user-name').textContent = '--';
        document.getElementById('return-date').textContent = '--';
        document.getElementById('return-expected-date').textContent = '--';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/livros/reservas/${reservationId}`);
        const reservation = await response.json();
        
        const bookResponse = await fetch(`${API_URL}/livros/${reservation.livroId}`);
        const book = await bookResponse.json();
        
        // Formatação das datas
        const reservaDate = new Date(reservation.dataReserva);
        const devolucaoDate = new Date(reservation.dataPrevistaDevolucao);
        
        document.getElementById('return-book-title').textContent = book.titulo;
        document.getElementById('return-user-name').textContent = reservation.nomeUsuario;
        document.getElementById('return-date').textContent = reservaDate.toLocaleDateString('pt-BR');
        document.getElementById('return-expected-date').textContent = devolucaoDate.toLocaleDateString('pt-BR');
    } catch (error) {
        showError('Erro ao carregar detalhes da reserva', error);
    }
}

async function returnBook(id = null) {
    // Se não for passado um ID, pega do select
    const reservationId = id || document.getElementById('return-reservation').value;
    
    if (!reservationId) {
        alert('Por favor, selecione uma reserva para devolução.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/livros/reservas/${reservationId}/devolver`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Devolução registrada com sucesso!');
            
            // Atualiza os componentes da interface
            if (!id) { // Se foi chamado da página de devolução
                document.getElementById('return-reservation').value = '';
                loadReservationDetails();
                loadReservationsForReturn();
                loadReturnHistory();
            } else { // Se foi chamado da lista de reservas ativas
                loadActiveReservations();
            }
        } else if (response.status === 409) {
            alert('Esta reserva já foi devolvida ou cancelada.');
        } else {
            const error = await response.text();
            throw new Error(error);
        }
    } catch (error) {
        showError('Erro ao registrar devolução', error);
    }
}

async function cancelReservation(id = null) {
    // Se não for passado um ID, pega do select
    const reservationId = id || document.getElementById('return-reservation').value;
    
    if (!reservationId) {
        alert('Por favor, selecione uma reserva para cancelamento.');
        return;
    }
    
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/livros/reservas/${reservationId}/cancelar`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Reserva cancelada com sucesso!');
            
            // Atualiza os componentes da interface
            if (!id) { // Se foi chamado da página de devolução
                document.getElementById('return-reservation').value = '';
                loadReservationDetails();
                loadReservationsForReturn();
                loadReturnHistory();
            } else { // Se foi chamado da lista de reservas ativas
                loadActiveReservations();
            }
        } else if (response.status === 409) {
            alert('Esta reserva já foi devolvida ou cancelada.');
        } else {
            const error = await response.text();
            throw new Error(error);
        }
    } catch (error) {
        showError('Erro ao cancelar reserva', error);
    }
}

async function loadReturnHistory() {
    try {
        const response = await fetch(`${API_URL}/livros/reservas`);
        const reservations = await response.json();
        
        const historyList = document.getElementById('return-history');
        historyList.innerHTML = '';
        
        // Filtra apenas reservas devolvidas ou canceladas
        const historyReservations = reservations.filter(r => r.devolvida || r.cancelada);
        
        if (historyReservations.length === 0) {
            historyList.innerHTML = '<p class="empty-message">Nenhum histórico de devolução disponível.</p>';
            return;
        }
        
        // Para cada reserva, busca informações do livro
        for (const reservation of historyReservations) {
            try {
                const bookResponse = await fetch(`${API_URL}/livros/${reservation.livroId}`);
                const book = await bookResponse.json();
                
                const reservationItem = document.createElement('div');
                reservationItem.className = reservation.devolvida 
                    ? 'reservation-item returned' 
                    : 'reservation-item canceled';
                
                // Formatação das datas
                const reservaDate = new Date(reservation.dataReserva);
                const statusDate = reservation.devolvida 
                    ? new Date(reservation.dataDevolucao) 
                    : new Date(reservation.dataCancelamento);
                
                reservationItem.innerHTML = `
                    <h4>${book.titulo}</h4>
                    <p><strong>Usuário:</strong> ${reservation.nomeUsuario}</p>
                    <p><strong>Data da Reserva:</strong> ${reservaDate.toLocaleDateString('pt-BR')}</p>
                    <p><strong>Status:</strong> ${reservation.devolvida ? 'Devolvido' : 'Cancelado'}</p>
                    <p><strong>Data de ${reservation.devolvida ? 'Devolução' : 'Cancelamento'}:</strong> ${statusDate.toLocaleDateString('pt-BR')}</p>
                `;
                
                historyList.appendChild(reservationItem);
            } catch (bookError) {
                console.error('Erro ao buscar detalhes do livro:', bookError);
            }
        }
    } catch (error) {
        showError('Erro ao carregar histórico de devoluções', error);
    }
}

// Funções utilitárias
function showError(message, error) {
    console.error(message, error);
    alert(`${message}: ${error.message || 'Erro desconhecido'}`);
}