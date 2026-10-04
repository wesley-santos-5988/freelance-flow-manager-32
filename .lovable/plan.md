# Contratos mensais e agenda de clientes

## Resultado
O app passará a tratar clientes como uma agenda reutilizável e serviços mensais como contratos, sem perder os serviços que já estão salvos no aparelho.

## Freela mensal recorrente
- Adicionar ao cadastro a opção **Serviço mensal**.
- Permitir escolher mês/ano inicial e um mês/ano final, ou marcar o término como **Indefinido**.
- Criar uma competência separada por mês, cada uma com fase e pagamento próprios.
- Para contratos com término definido, gerar os meses do período escolhido.
- Para contratos indefinidos, gerar desde o início até o mês atual e acrescentar automaticamente cada novo mês quando ele chegar.
- Meses futuros ainda não iniciados não entrarão como dívida.
- Identificar discretamente serviços recorrentes nos cards.

## Agenda de clientes
- Criar uma tela de clientes acessível pela barra inferior, mantendo o botão **+** fixo no centro.
- No cadastro de serviço, permitir buscar um cliente existente ou criar um novo pelo nome.
- Exibir cada cliente com saldo devedor total, valor já recebido e quantidade de serviços.
- Ao abrir um cliente, mostrar suas competências mensais e débitos, com acesso aos respectivos meses.
- Calcular dívida como: **100% do Não pago + 50% do parcial + zero do Pago**.

## Dados existentes
- Converter automaticamente os nomes dos serviços atuais em clientes únicos, sem apagar ou duplicar lançamentos.
- Manter os dados no aparelho e preservar o funcionamento offline.
- Validar nomes, valores e intervalos de datas antes de salvar.

## Navegação e acabamento
- Reorganizar os ícones da barra flutuante para incluir Clientes sem deslocar visualmente o botão central.
- Manter os temas claro/escuro e o estilo compacto atual.
- Incluir estados vazios e mensagens claras para contratos e clientes sem débitos.

## Validação
- Testar contrato com fim definido e indefinido.
- Confirmar que alterar o pagamento de um mês não muda os demais.
- Conferir totais por cliente e a migração dos serviços atuais.
- Verificar mobile e desktop, nos dois temas, além da compilação e testes existentes.

## Detalhes técnicos
Os dados locais serão normalizados em clientes, contratos e competências mensais, com uma migração versionada executada uma única vez. Contratos serão vinculados às competências por identificadores estáveis; lançamentos avulsos continuarão suportados.
