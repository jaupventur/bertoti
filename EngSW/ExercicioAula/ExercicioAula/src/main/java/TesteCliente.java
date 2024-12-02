import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class TesteCliente {
    @Test
    void testAdicionarCliente() {
        LojaVirtual loja = new LojaVirtual();
        Cliente cliente = new Cliente("Carlos", 101);
        loja.adicionarCliente(cliente);
        assertEquals(1, loja.getClientes().size());
    }
}
