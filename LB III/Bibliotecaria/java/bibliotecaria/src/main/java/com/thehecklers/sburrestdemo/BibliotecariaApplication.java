package com.thehecklers.sburrestdemo;


import java.text.ParseException;
import java.text.SimpleDateFormat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@SpringBootApplication
public class BibliotecariaApplication {

  public static void main(String[] args) {
    SpringApplication.run(BibliotecariaApplication.class, args);
  }

}

@RestController
@RequestMapping("/livros")
class LivroController {
  private List<Livro> livros = new ArrayList<>();
  private List<Reserva> reservas = new ArrayList<>();

  public LivroController() {
    SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy");
    try {
      livros.addAll(List.of(
          new Livro("A Arte da Guerra", "Sun Tzu", "Estratégia", formatter.parse("01/01/1500"), 5),
          new Livro("Dom Quixote", "Miguel de Cervantes", "Romance", formatter.parse("01/01/1605"), 3),
          new Livro("Crime e Castigo", "Fiódor Dostoiévski", "Romance", formatter.parse("01/01/1866"), 2),
          new Livro("1984", "George Orwell", "Ficção Científica", formatter.parse("08/06/1949"), 4)));
    } catch (ParseException e) {
      e.printStackTrace();
    }
  }

  // CRUD básico
  @CrossOrigin(origins = "*")
  @GetMapping
  Iterable<Livro> getLivros() {
    return livros;
  }

  @CrossOrigin(origins = "*")
  @GetMapping("/{id}")
  ResponseEntity<Livro> getLivroById(@PathVariable String id) {
    Optional<Livro> livro = livros.stream()
        .filter(l -> l.getId().equals(id))
        .findFirst();
    
    return livro.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
        .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
  }

  @CrossOrigin(origins = "*")
  @GetMapping("/busca")
  List<Livro> buscarLivros(@RequestParam(required = false) String titulo, 
                           @RequestParam(required = false) String autor,
                           @RequestParam(required = false) String genero) {
    return livros.stream()
        .filter(l -> (titulo == null || l.getTitulo().toLowerCase().contains(titulo.toLowerCase())) &&
                     (autor == null || l.getAutor().toLowerCase().contains(autor.toLowerCase())) &&
                     (genero == null || l.getGenero().toLowerCase().contains(genero.toLowerCase())))
        .collect(Collectors.toList());
  }

  @CrossOrigin(origins = "*")
  @PostMapping
  ResponseEntity<Livro> cadastrarLivro(@RequestBody Livro livro) {
    livros.add(livro);
    return new ResponseEntity<>(livro, HttpStatus.CREATED);
  }

  @CrossOrigin(origins = "*")
  @PutMapping("/{id}")
  ResponseEntity<Livro> atualizarLivro(@PathVariable String id, @RequestBody Livro livro) {
    int livroIndex = -1;

    for (Livro l : livros) {
      if (l.getId().equals(id)) {
        livroIndex = livros.indexOf(l);
        livro.setId(id);
        livros.set(livroIndex, livro);
        break;
      }
    }

    return (livroIndex == -1) ? 
        new ResponseEntity<>(HttpStatus.NOT_FOUND) : 
        new ResponseEntity<>(livro, HttpStatus.OK);
  }

  @CrossOrigin(origins = "*")
  @DeleteMapping("/{id}")
  ResponseEntity<Livro> removerLivro(@PathVariable String id) {
    Optional<Livro> livro = livros.stream()
        .filter(l -> l.getId().equals(id))
        .findFirst();
    
    if (livro.isPresent()) {
      boolean possuiReservas = reservas.stream()
          .anyMatch(r -> r.getLivroId().equals(id) && !r.isCancelada());
      
      if (possuiReservas) {
        return new ResponseEntity<>(HttpStatus.CONFLICT);
      }
      
      livros.remove(livro.get());
      return new ResponseEntity<>(livro.get(), HttpStatus.OK);
    }
    
    return new ResponseEntity<>(HttpStatus.NOT_FOUND);
  }
  
  @CrossOrigin(origins = "*")
  @PostMapping("/{id}/reservar")
  ResponseEntity<Reserva> reservarLivro(@PathVariable String id, @RequestBody Usuario usuario) {
    Optional<Livro> livroOpt = livros.stream()
        .filter(l -> l.getId().equals(id))
        .findFirst();
    
    if (livroOpt.isEmpty()) {
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
    
    Livro livro = livroOpt.get();

    int reservasAtivas = (int) reservas.stream()
        .filter(r -> r.getLivroId().equals(id) && !r.isCancelada() && !r.isDevolvida())
        .count();
    
    if (reservasAtivas >= livro.getQuantidadeDisponivel()) {
      return new ResponseEntity<>(HttpStatus.CONFLICT);
    }

    Reserva reserva = new Reserva(livro.getId(), usuario.getId(), usuario.getNome());
    reservas.add(reserva);
    
    return new ResponseEntity<>(reserva, HttpStatus.CREATED);
  }

  @CrossOrigin(origins = "*")
  @GetMapping("/reservas")
  List<Reserva> listarReservas(@RequestParam(required = false) String usuarioId) {
    if (usuarioId != null) {
      return reservas.stream()
          .filter(r -> r.getUsuarioId().equals(usuarioId))
          .collect(Collectors.toList());
    }
    return reservas;
  }
  
  @CrossOrigin(origins = "*")
  @GetMapping("/reservas/{id}")
  ResponseEntity<Reserva> buscarReserva(@PathVariable String id) {
    Optional<Reserva> reserva = reservas.stream()
        .filter(r -> r.getId().equals(id))
        .findFirst();
    
    return reserva.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
        .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
  }

  @CrossOrigin(origins = "*")
  @PutMapping("/reservas/{id}/cancelar")
  ResponseEntity<Reserva> cancelarReserva(@PathVariable String id) {
    Optional<Reserva> reservaOpt = reservas.stream()
        .filter(r -> r.getId().equals(id))
        .findFirst();
    
    if (reservaOpt.isEmpty()) {
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
    
    Reserva reserva = reservaOpt.get();
    
    if (reserva.isDevolvida()) {
      return new ResponseEntity<>(HttpStatus.CONFLICT); // Já foi devolvida
    }
    
    reserva.setCancelada(true);
    reserva.setDataCancelamento(new Date());
    
    return new ResponseEntity<>(reserva, HttpStatus.OK);
  }
  
  @CrossOrigin(origins = "*")
  @PutMapping("/reservas/{id}/devolver")
  ResponseEntity<Reserva> devolverLivro(@PathVariable String id) {
    Optional<Reserva> reservaOpt = reservas.stream()
        .filter(r -> r.getId().equals(id))
        .findFirst();
    
    if (reservaOpt.isEmpty()) {
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
    
    Reserva reserva = reservaOpt.get();
    
    if (reserva.isCancelada()) {
      return new ResponseEntity<>(HttpStatus.CONFLICT); // Reserva já cancelada
    }
    
    if (reserva.isDevolvida()) {
      return new ResponseEntity<>(HttpStatus.CONFLICT); // Já devolvido
    }
    
    reserva.setDevolvida(true);
    reserva.setDataDevolucao(new Date());
    
    return new ResponseEntity<>(reserva, HttpStatus.OK);
  }
}

class Livro {
  private String id;
  private String titulo;
  private String autor;
  private String genero;
  private Date publicacao;
  private int quantidadeDisponivel;

  public Livro() {
    this.id = UUID.randomUUID().toString();
    this.titulo = "";
    this.autor = "";
    this.genero = "";
    this.publicacao = new Date();
    this.quantidadeDisponivel = 0;
  }

  public Livro(String titulo, String autor, String genero, Date publicacao, int quantidadeDisponivel) {
    this.id = UUID.randomUUID().toString();
    this.titulo = titulo;
    this.autor = autor;
    this.genero = genero;
    this.publicacao = publicacao;
    this.quantidadeDisponivel = quantidadeDisponivel;
  }

  // Getters e Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitulo() {
    return titulo;
  }

  public void setTitulo(String titulo) {
    this.titulo = titulo;
  }

  public String getAutor() {
    return autor;
  }

  public void setAutor(String autor) {
    this.autor = autor;
  }

  public String getGenero() {
    return genero;
  }

  public void setGenero(String genero) {
    this.genero = genero;
  }

  public Date getPublicacao() {
    return publicacao;
  }

  public void setPublicacao(Date publicacao) {
    this.publicacao = publicacao;
  }

  public int getQuantidadeDisponivel() {
    return quantidadeDisponivel;
  }

  public void setQuantidadeDisponivel(int quantidadeDisponivel) {
    this.quantidadeDisponivel = quantidadeDisponivel;
  }
}

class Reserva {
  private String id;
  private String livroId;
  private String usuarioId;
  private String nomeUsuario;
  private Date dataReserva;
  private Date dataPrevistaDevolucao;
  private Date dataDevolucao;
  private Date dataCancelamento;
  private boolean cancelada;
  private boolean devolvida;

  public Reserva() {
    this.id = UUID.randomUUID().toString();
    this.dataReserva = new Date();
    this.dataPrevistaDevolucao = new Date(System.currentTimeMillis() + 7 * 24 * 60 * 60 * 1000);
    this.cancelada = false;
    this.devolvida = false;
  }

  public Reserva(String livroId, String usuarioId, String nomeUsuario) {
    this();
    this.livroId = livroId;
    this.usuarioId = usuarioId;
    this.nomeUsuario = nomeUsuario;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getLivroId() {
    return livroId;
  }

  public void setLivroId(String livroId) {
    this.livroId = livroId;
  }

  public String getUsuarioId() {
    return usuarioId;
  }

  public void setUsuarioId(String usuarioId) {
    this.usuarioId = usuarioId;
  }

  public String getNomeUsuario() {
    return nomeUsuario;
  }

  public void setNomeUsuario(String nomeUsuario) {
    this.nomeUsuario = nomeUsuario;
  }

  public Date getDataReserva() {
    return dataReserva;
  }

  public void setDataReserva(Date dataReserva) {
    this.dataReserva = dataReserva;
  }

  public Date getDataPrevistaDevolucao() {
    return dataPrevistaDevolucao;
  }

  public void setDataPrevistaDevolucao(Date dataPrevistaDevolucao) {
    this.dataPrevistaDevolucao = dataPrevistaDevolucao;
  }

  public Date getDataDevolucao() {
    return dataDevolucao;
  }

  public void setDataDevolucao(Date dataDevolucao) {
    this.dataDevolucao = dataDevolucao;
  }

  public Date getDataCancelamento() {
    return dataCancelamento;
  }

  public void setDataCancelamento(Date dataCancelamento) {
    this.dataCancelamento = dataCancelamento;
  }

  public boolean isCancelada() {
    return cancelada;
  }

  public void setCancelada(boolean cancelada) {
    this.cancelada = cancelada;
  }

  public boolean isDevolvida() {
    return devolvida;
  }

  public void setDevolvida(boolean devolvida) {
    this.devolvida = devolvida;
  }
}

class Usuario {
  private String id;
  private String nome;
  private String email;
  private String telefone;

  public Usuario() {
    this.id = UUID.randomUUID().toString();
  }

  public Usuario(String nome, String email, String telefone) {
    this();
    this.nome = nome;
    this.email = email;
    this.telefone = telefone;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getNome() {
    return nome;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getTelefone() {
    return telefone;
  }

  public void setTelefone(String telefone) {
    this.telefone = telefone;
  }
}