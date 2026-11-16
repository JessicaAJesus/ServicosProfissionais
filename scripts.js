/* pessoa física / pessoa jurídica */

var TIPOS_PESSOA = {
    PF: { grupo: 'camposPF', obrigatorios: ['nome', 'cpf', 'dataNascimento'] },
    PJ: { grupo: 'camposPJ', obrigatorios: ['razaoSocial', 'cnpj', 'responsavel'] }
};

/* Mostra os campos do tipo selecionado e esconde os do outro tipo */
function mostrarCamposPessoa(tipoSelecionado) {
    Object.keys(TIPOS_PESSOA).forEach(function (tipo) {
        var config = TIPOS_PESSOA[tipo];
        var grupo = document.getElementById(config.grupo);
        var ativo = (tipo === tipoSelecionado);

        grupo.hidden = !ativo;

        /* campos escondidos desabilitados */
        grupo.querySelectorAll('input').forEach(function (campo) {
            campo.disabled = !ativo;
            if (!ativo) {
                limparErro(campo);
            }
        });

        config.obrigatorios.forEach(function (id) {
            document.getElementById(id).required = ativo;
        });
    });
}

/* funções de validação */

/* Nome e sobrenome, só com letras */
function validarNomePessoa(nome) {
    var palavras = nome.split(/\s+/);
    if (palavras.length < 2) {
        return 'Informe nome e sobrenome.';
    }
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(nome)) {
        return 'Use apenas letras no nome.';
    }
    return '';
}

/*  Validação do formulário (exceto o que o html já valida como campos obrigatórios, e-mail, CPF, CNPJ, telefone e CEP,
   tamanho mínimo e limites de data )  */

var VALIDADORES = {
    nome: validarNomePessoa,
    responsavel: validarNomePessoa,
    cidade: function (v) {
        return v.length >= 2 ? '' : 'Informe a cidade.';
    },
    logradouro: function (v) {
        return v.length >= 3 ? '' : 'Informe o logradouro.';
    },
    numero: function (v) {
        return /^(\d+[A-Za-z]?|s\/?n)$/i.test(v) ? '' : 'Informe o número (ex.: 123 ou s/n).';
    }
};

/* Devolve a mensagem de erro de um campo, ou texto vazio se estiver válido */
function obterErro(campo) {
    var valor = campo.value.trim();
    if (valor === '') {
        return ''; /* campo vazio: quem avisa é o required do HTML */
    }

    var validador = VALIDADORES[campo.id];
    return validador ? validador(valor, campo) : '';
}

/* mensagens de erro na tela */

function obterAviso(campo) {
    var id = 'erro-' + campo.id;
    var aviso = document.getElementById(id);
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = id;
        aviso.className = 'invalid-feedback';
        if (campo.type === 'checkbox') {
            campo.parentNode.appendChild(aviso);
        } else {
            campo.insertAdjacentElement('afterend', aviso);
        }
        campo.setAttribute('aria-describedby', id);
    }
    return aviso;
}

function mostrarErro(campo, mensagem) {
    obterAviso(campo).textContent = mensagem;
    campo.classList.add('is-invalid');
    campo.setAttribute('aria-invalid', 'true');
}

function limparErro(campo) {
    campo.classList.remove('is-invalid');
    campo.removeAttribute('aria-invalid');
    var aviso = document.getElementById('erro-' + campo.id);
    if (aviso) {
        aviso.textContent = '';
    }
}

/* Valida um campo e mostra ou limpa o erro. Devolve true se o campo estiver válido */
function validarCampo(campo) {
    /* Os grupos de radio já vêm com uma opção marcada, então não precisam de validação */
    if (campo.type === 'radio') {
        return true;
    }
    var erro = obterErro(campo);
    if (erro) {
        mostrarErro(campo, erro);
        return false;
    }
    limparErro(campo);
    return true;
}

/* Valida todos os campos habilitados e devolve a lista dos inválidos */
function validarFormulario(form) {
    var invalidos = [];
    form.querySelectorAll('input, select, textarea').forEach(function (campo) {
        if (!campo.disabled && !validarCampo(campo)) {
            invalidos.push(campo);
        }
    });
    return invalidos;
}

function limparErros(form) {
    form.querySelectorAll('input, select, textarea').forEach(limparErro);
}

/* Botão de enviar */

/* true quando todos os campos obrigatórios estão preenchidos */
function todosObrigatoriosPreenchidos(form) {
    var preenchidos = true;
    form.querySelectorAll('[required]').forEach(function (campo) {
        if (campo.disabled) {
            return;
        }
        if (campo.type === 'checkbox') {
            preenchidos = preenchidos && campo.checked;
        } else if (campo.type === 'radio') {
            preenchidos = preenchidos &&
                form.querySelector('input[name="' + campo.name + '"]:checked') !== null;
        } else {
            preenchidos = preenchidos && campo.value.trim() !== '';
        }
    });
    return preenchidos;
}

function atualizarBotaoEnviar(form) {
    form.querySelector('button[type="submit"]').disabled = !todosObrigatoriosPreenchidos(form);
}

/* envio: mostra os dados em uma caixa de diálogo */

var ROTULOS_GRUPO = {
    tipoPessoa: 'Tipo de cliente',
    urgencia: 'Urgência',
    contato: 'Contato preferido',
    termos: 'Aceite'
};

function textoDoRotulo(campo) {
    var rotulo = document.querySelector('label[for="' + campo.id + '"]');
    if (!rotulo) {
        return campo.name;
    }
    return rotulo.textContent.replace(/\(opcional\)/i, '').replace(/\s+/g, ' ').trim();
}

function formatarData(iso) {
    var partes = iso.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function montarResumo(form) {
    var entradas = [];
    var grupos = {};

    Array.prototype.forEach.call(form.elements, function (campo) {
        if (!campo.name || campo.disabled) {
            return;
        }

        /* radios e checkboxes: junta as opções marcadas de cada grupo */
        if (campo.type === 'radio' || campo.type === 'checkbox') {
            if (!grupos[campo.name]) {
                grupos[campo.name] = { rotulo: ROTULOS_GRUPO[campo.name] || campo.name, valores: [] };
                entradas.push(grupos[campo.name]);
            }
            if (campo.checked) {
                grupos[campo.name].valores.push(textoDoRotulo(campo));
            }
            return;
        }

        var valor = campo.value.trim();
        if (valor === '') {
            return;
        }
        if (campo.tagName === 'SELECT') {
            valor = campo.options[campo.selectedIndex].text;
        } else if (campo.type === 'date') {
            valor = formatarData(valor);
        }
        entradas.push({ rotulo: textoDoRotulo(campo), valores: [valor] });
    });

    var linhas = ['Pedido de orçamento enviado com os dados:', ''];
    entradas.forEach(function (entrada) {
        if (entrada.valores.length > 0) {
            linhas.push(entrada.rotulo + ': ' + entrada.valores.join(', '));
        }
    });
    return linhas.join('\n');
}

function enviarFormulario(evento, form) {
    evento.preventDefault();

    var invalidos = validarFormulario(form);
    if (invalidos.length > 0) {
        invalidos[0].focus();
        return;
    }
    alert(montarResumo(form));
}

/* inicialização */

function formatarISO(data) {
    var mes = String(data.getMonth() + 1).padStart(2, '0');
    var dia = String(data.getDate()).padStart(2, '0');
    return data.getFullYear() + '-' + mes + '-' + dia;
}

/* Data desejada a partir de hoje, e data de nascimento no mínimo 18 anos */
function definirLimitesDeData() {
    var hoje = new Date();
    var dataDesejada = document.getElementById('data');
    var nascimento = document.getElementById('dataNascimento');
    if (dataDesejada) {
        dataDesejada.min = formatarISO(hoje);
    }
    if (nascimento) {
        nascimento.max = formatarISO(new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate()));
    }
}

function ehCampo(elemento) {
    return /^(INPUT|SELECT|TEXTAREA)$/.test(elemento.tagName);
}

function iniciarFormularioOrcamento() {
    var form = document.getElementById('formOrcamento');
    if (!form) {
        return; /* nas outras páginas não tem esse formulário */
    }

    definirLimitesDeData();

    function atualizarTipoPessoa() {
        var marcado = form.querySelector('input[name="tipoPessoa"]:checked');
        mostrarCamposPessoa(marcado.value);
        atualizarBotaoEnviar(form);
    }

    form.querySelectorAll('input[name="tipoPessoa"]').forEach(function (radio) {
        radio.addEventListener('change', atualizarTipoPessoa);
    });

    /* ao sair de um campo, mostra o erro (se houver) */
    form.addEventListener('focusout', function (evento) {
        if (ehCampo(evento.target)) {
            validarCampo(evento.target);
        }
    });

    /* ao digitar, tira o erro assim que o campo ficar correto e atualiza o botão */
    function aoAlterarCampo(evento) {
        var campo = evento.target;
        if (ehCampo(campo) && campo.classList.contains('is-invalid')) {
            validarCampo(campo);
        }
        atualizarBotaoEnviar(form);
    }
    form.addEventListener('input', aoAlterarCampo);
    form.addEventListener('change', aoAlterarCampo);

    form.addEventListener('submit', function (evento) {
        enviarFormulario(evento, form);
    });

    /* o botão "limpar" volta para pessoa física sem disparar o evento */
    form.addEventListener('reset', function () {
        setTimeout(function () {
            limparErros(form);
            atualizarTipoPessoa();
        }, 0);
    });

    atualizarTipoPessoa();
}

document.addEventListener('DOMContentLoaded', iniciarFormularioOrcamento);


/* TABELA DE PREÇOS */

/* Converte o número do json em texto de moeda */
function formatarPreco(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* Recebe um serviço do json e devolve a linha <tr> pronta com 4 colunas */
function criarLinhaServico(servico) {
    var linha = document.createElement('tr');

    /* 1ª coluna: nome do serviço */
    var nome = document.createElement('th');
    nome.scope = 'row';
    nome.textContent = servico.servico;
    linha.appendChild(nome);

    /* 2ª e 3ª colunas: descrição e unidade */
    [servico.descricao, servico.unidade].forEach(function (texto) {
        var celula = document.createElement('td');
        celula.textContent = texto;
        linha.appendChild(celula);
    });

    /* 4ª coluna: preço formatado */
    var preco = document.createElement('td');
    preco.className = 'text-end text-nowrap';
    preco.textContent = formatarPreco(servico.preco);
    linha.appendChild(preco);

    return linha;
}

/* Troca o conteúdo do <tbody> por uma única linha de aviso (erro ou categoria vazia) */
function mostrarAvisoTabela(corpo, mensagem, classe) {
    var linha = document.createElement('tr');
    var celula = document.createElement('td');
    celula.colSpan = 4;
    celula.className = 'text-center ' + classe;
    celula.textContent = mensagem;
    linha.appendChild(celula);
    corpo.textContent = '';
    corpo.appendChild(linha);
}

/* Preenche cada tabela com a lista da sua categoria (id da <section> é a chave no json) */

function preencherTabelas(dados) {
    document.querySelectorAll('section.categoria').forEach(function (secao) {
        var corpo = secao.querySelector('tbody');
        var servicos = dados[secao.id];

        /* Categoria ausente ou vazia no JSON */
        if (!servicos || servicos.length === 0) {
            mostrarAvisoTabela(corpo, 'Nenhum serviço cadastrado nesta categoria.', 'text-body-secondary');
            return;
        }

        corpo.textContent = ''; /* remove o "carregando preços..." p/ novas linhas */
        servicos.forEach(function (servico) {
            corpo.appendChild(criarLinhaServico(servico));
        });
    });
}

/* Mostra a mensagem de erro em todas as tabelas */
function mostrarErroTabelas() {
    document.querySelectorAll('section.categoria tbody').forEach(function (corpo) {
        mostrarAvisoTabela(corpo, 'Não foi possível carregar os preços. Tente novamente mais tarde.', 'text-danger');
    });
}

/* Requisição ajax: busca o tabela.json em segundo plano, sem recarregar a página */
function carregarTabelaPrecos() {
    if (!document.querySelector('section.categoria tbody')) {
        return; /* as outras páginas não tem a tabela de preços */
    }

    var requisicao = new XMLHttpRequest();
    requisicao.open('GET', 'tabela.json'); /* método e arquivo pedido */

    /* Executa quando a resposta chega */
    requisicao.onload = function () {
        var sucesso = requisicao.status === 200 || (requisicao.status === 0 && requisicao.responseText);
        if (!sucesso) {
            mostrarErroTabelas();
            return;
        }
        try {
            /* JSON.parse converte o texto do arquivo em objeto JavaScript */
            preencherTabelas(JSON.parse(requisicao.responseText));
        } catch (erro) {
            console.error('tabela.json inválido:', erro); /* JSON com erro de sintaxe */
            mostrarErroTabelas();
        }
    };

    /* Executa se a requisição falhar (arquivo bloqueado, sem conexão etc) */
    requisicao.onerror = function () {
        mostrarErroTabelas();
    };

    requisicao.send(); /* dispara a requisição */
}

/* Chama a requisição assim que o HTML da página termina de carregar */
document.addEventListener('DOMContentLoaded', carregarTabelaPrecos);

/* PÁGINA DE SERVIÇOS (FILTROS E BUSCA) */

/* Remove acentos e padroniza em minúsculas para facilitar a comparação na busca */
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/* Inicializa os eventos de busca e filtragem da página de serviços */
function iniciarFiltroServicos() {
    var lista = document.getElementById('listaProfissionais');
    if (!lista) {
        return; /* evita execução nas outras páginas que não possuem essa listagem */
    }

    /* Referências aos elementos de entrada, botões e cards do DOM */
    var campoBusca = document.getElementById('campoBusca');
    var inputMin = document.getElementById('preco-min');
    var inputMax = document.getElementById('preco-max');
    var btnAplicar = document.getElementById('btnAplicarFiltros');
    var botoesCategoria = document.querySelectorAll('#filtroCategorias .card-categoria');
    var cards = lista.querySelectorAll('article[data-categoria]');
    var avisoVazio = document.getElementById('semResultados');

    var categoriaSelecionada = '';

    /* Avalia todos os critérios (categoria, faixa de preço e busca) e atualiza a exibição dos cards */
    function filtrarProfissionais() {
        var termoBusca = campoBusca ? normalizarTexto(campoBusca.value.trim()) : '';
        var precoMin = inputMin && inputMin.value !== '' ? parseFloat(inputMin.value) : 0;
        var precoMax = inputMax && inputMax.value !== '' ? parseFloat(inputMax.value) : Infinity;
        var visiveis = 0;

        cards.forEach(function (card) {
            /* Lê os metadados configurados nos atributos data-* de cada profissional */
            var categoriaCard = card.getAttribute('data-categoria');
            var precoCard = parseFloat(card.getAttribute('data-preco'));
            var textoCard = normalizarTexto(card.textContent);

            /* Verifica se o card atende simultaneamente aos três critérios */
            var bateCategoria = !categoriaSelecionada || categoriaCard === categoriaSelecionada;
            var batePreco = precoCard >= precoMin && precoCard <= precoMax;
            var bateBusca = !termoBusca || textoCard.indexOf(termoBusca) !== -1;

            var mostrar = bateCategoria && batePreco && bateBusca;
            card.hidden = !mostrar;

            if (mostrar) {
                visiveis++;
            }
        });

        /* Exibe o aviso caso nenhum profissional corresponda aos filtros */
        if (avisoVazio) {
            avisoVazio.hidden = visiveis > 0;
        }
    }

    /* Seleção de categoria (clicar na mesma categoria desmarca o filtro) */
    botoesCategoria.forEach(function (botao) {
        botao.addEventListener('click', function () {
            var categoria = botao.getAttribute('data-categoria');

            if (categoriaSelecionada === categoria) {
                categoriaSelecionada = '';
                botao.classList.remove('ativo');
            } else {
                botoesCategoria.forEach(function (b) {
                    b.classList.remove('ativo');
                });
                categoriaSelecionada = categoria;
                botao.classList.add('ativo');
            }
        });
    });

    /* Botão "Aplicar filtros" aplica categoria + preço */
    if (btnAplicar) {
        btnAplicar.addEventListener('click', filtrarProfissionais);
    }

    /* Barra de busca filtra em tempo real conforme digita */
    if (campoBusca) {
        campoBusca.addEventListener('input', filtrarProfissionais);
    }
}

/* Executa a inicialização assim que o HTML terminar de carregar */
document.addEventListener('DOMContentLoaded', iniciarFiltroServicos);