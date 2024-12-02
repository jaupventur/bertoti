import java.util.List;
import java.util.LinkedList;

public class LojaVirtual {
    private List<Cliente> clientes = new LinkedList<>();

    public void adicionarCliente(Cliente cliente) {
        clientes.add(cliente);
    }

    public List<Cliente> getClientes() {
        return clientes;
    }
}