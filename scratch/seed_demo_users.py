import psycopg2
from backend.security import gerar_senha_hash
from backend.repository import UsuarioRepository
from backend.disciplina_repository import DisciplinaRepository
from backend.tarefa_repository import TarefaRepository
from backend.sessao_repository import SessaoRepository

def seed_demo_data():
    user_repo = UsuarioRepository()
    disc_repo = DisciplinaRepository()
    task_repo = TarefaRepository()
    sess_repo = SessaoRepository()

    users_data = [
        {
            "login": "danilokofugi@gmail.com",
            "nome": "Danilo Kofugi",
            "senha": "123123",
            "subjects": [
                {
                    "nome": "Algoritmos e Estrutura de Dados",
                    "professor": "Prof. Dr. Marcos Silveira",
                    "carga_horaria": 80,
                    "descricao": "Estudo de estruturas de dados lineares e não-lineares, árvores e grafos.",
                    "data_inicio": "2026-08-01",
                    "data_fim": "2026-12-15",
                    "cor": "#10b981",
                    "tasks": [
                        {"titulo": "Implementação de Árvore AVL em Python", "descricao": "Entregar repositório no GitHub com testes.", "prazo": "2026-10-10", "status": "completed"},
                        {"titulo": "Lista de Exercícios sobre Grafos e Dijkstra", "descricao": "Resolver exercícios 1 a 15 do livro texto.", "prazo": "2026-10-18", "status": "in_progress"},
                        {"titulo": "Projeto Final - Sistema de Rotas", "descricao": "Implementar algoritmo A* para mapas digitais.", "prazo": "2026-11-20", "status": "pending"}
                    ],
                    "sessions": [
                        {"titulo": "Estudo de Árvores AVL", "duracao": 3600},
                        {"titulo": "Resolução de Algoritmo de Dijkstra", "duracao": 2700}
                    ]
                },
                {
                    "nome": "Inteligência Artificial & Machine Learning",
                    "professor": "Profa. Dra. Camila Duarte",
                    "carga_horaria": 60,
                    "descricao": "Modelos preditivos, redes neurais convolucionais e PLN.",
                    "data_inicio": "2026-08-05",
                    "data_fim": "2026-12-20",
                    "cor": "#0ea5e9",
                    "tasks": [
                        {"titulo": "Treinamento de Modelo de Regressão Linear", "descricao": "Ajuste de hiperparâmetros no Scikit-Learn.", "prazo": "2026-10-05", "status": "completed"},
                        {"titulo": "Artigo sobre Transformers e LLMs", "descricao": "Resumo crítico de 3 páginas.", "prazo": "2026-10-25", "status": "pending"}
                    ],
                    "sessions": [
                        {"titulo": "Prática com Scikit-Learn", "duracao": 4500}
                    ]
                },
                {
                    "nome": "Engenharia de Software",
                    "professor": "Prof. Roberto Mendes",
                    "carga_horaria": 64,
                    "descricao": "Metodologias ágeis, arquitetura de software e testes integrados.",
                    "data_inicio": "2026-08-10",
                    "data_fim": "2026-12-10",
                    "cor": "#8b5cf6",
                    "tasks": [
                        {"titulo": "Modelagem de Casos de Uso e Diagrama C4", "descricao": "Diagramas em C4 model para o EduTrack AI.", "prazo": "2026-10-12", "status": "in_progress"}
                    ],
                    "sessions": [
                        {"titulo": "Desenho de Arquitetura C4", "duracao": 3000}
                    ]
                }
            ]
        },
        {
            "login": "gabrielsousa@gmail.com",
            "nome": "Gabriel Sousa",
            "senha": "123123",
            "subjects": [
                {
                    "nome": "Cálculo Diferencial e Integral I",
                    "professor": "Prof. Ricardo Santos",
                    "carga_horaria": 80,
                    "descricao": "Limites, derivadas, regras de cadeia e introdução a integrais.",
                    "data_inicio": "2026-08-01",
                    "data_fim": "2026-12-15",
                    "cor": "#ef4444",
                    "tasks": [
                        {"titulo": "Lista 1 - Limites e Continuidade", "descricao": "Exercícios 1 a 30.", "prazo": "2026-09-30", "status": "completed"},
                        {"titulo": "Lista 2 - Derivadas e Taxa de Variação", "descricao": "Exercícios ímpares do capítulo 3.", "prazo": "2026-10-14", "status": "in_progress"},
                        {"titulo": "Preparação para a P1 de Cálculo", "descricao": "Revisar provas dos anos anteriores.", "prazo": "2026-10-22", "status": "pending"}
                    ],
                    "sessions": [
                        {"titulo": "Resolução de Limites Infinitos", "duracao": 3200},
                        {"titulo": "Revisão de Regra da Cadeia", "duracao": 2400}
                    ]
                },
                {
                    "nome": "Física Geral I",
                    "professor": "Prof. Dr. Fernando Paiva",
                    "carga_horaria": 72,
                    "descricao": "Cinemática, leis de Newton, trabalho e energia conservativa.",
                    "data_inicio": "2026-08-03",
                    "data_fim": "2026-12-18",
                    "cor": "#f59e0b",
                    "tasks": [
                        {"titulo": "Relatório de Laboratório - Queda Livre", "descricao": "Calcular aceleração da gravidade local com incertezas.", "prazo": "2026-10-08", "status": "completed"},
                        {"titulo": "Exercícios de Conservação de Energia", "descricao": "Capítulo 7 do Halliday.", "prazo": "2026-10-20", "status": "pending"}
                    ],
                    "sessions": [
                        {"titulo": "Análise de Dados do Lab Queda Livre", "duracao": 3600}
                    ]
                }
            ]
        },
        {
            "login": "davidourado@gmail.com",
            "nome": "Davi Dourado",
            "senha": "123123",
            "subjects": [
                {
                    "nome": "Banco de Dados & SQL Avançado",
                    "professor": "Profa. Juliana Melo",
                    "carga_horaria": 64,
                    "descricao": "Modelagem relacional, normalização 3FN e otimização de queries no PostgreSQL.",
                    "data_inicio": "2026-08-05",
                    "data_fim": "2026-12-12",
                    "cor": "#06b6d4",
                    "tasks": [
                        {"titulo": "Modelagem E-R do Sistema Hospitalar", "descricao": "Entrega do modelo conceitual e lógico.", "prazo": "2026-10-02", "status": "completed"},
                        {"titulo": "Otimização de Índices e Explain Analyze", "descricao": "Tunar 5 queries lentas usando índices B-Tree.", "prazo": "2026-10-15", "status": "in_progress"}
                    ],
                    "sessions": [
                        {"titulo": "Prática de Joins e Window Functions", "duracao": 4200}
                    ]
                },
                {
                    "nome": "Redes de Computadores",
                    "professor": "Prof. Marcelo Rossi",
                    "carga_horaria": 60,
                    "descricao": "Modelo OSI, protocolo TCP/IP, roteamento e segurança de redes.",
                    "data_inicio": "2026-08-08",
                    "data_fim": "2026-12-14",
                    "cor": "#ec4899",
                    "tasks": [
                        {"titulo": "Análise de Pacotes com Wireshark", "descricao": "Captura e análise de um handshake TCP.", "prazo": "2026-10-11", "status": "completed"},
                        {"titulo": "Subroteamento IPv4 e CIDR", "descricao": "Calcular máscaras de sub-rede para a empresa fictícia.", "prazo": "2026-10-28", "status": "pending"}
                    ],
                    "sessions": [
                        {"titulo": "Captura Wireshark HTTP/HTTPS", "duracao": 2800}
                    ]
                },
                {
                    "nome": "Sistemas Operacionais",
                    "professor": "Prof. André Castro",
                    "carga_horaria": 64,
                    "descricao": "Gerenciamento de processos, threads, memória virtual e escalonamento.",
                    "data_inicio": "2026-08-02",
                    "data_fim": "2026-12-16",
                    "cor": "#14b8a6",
                    "tasks": [
                        {"titulo": "Simulador de Escalonador CPU (Round Robin)", "descricao": "Código C ou Python simulando quantuns de tempo.", "prazo": "2026-10-30", "status": "pending"}
                    ],
                    "sessions": [
                        {"titulo": "Estudo de Algoritmos de Escalonamento", "duracao": 3100}
                    ]
                }
            ]
        }
    ]

    print("[+] Semeando usuários de demonstração...")

    for udata in users_data:
        login = udata["login"]
        nome = udata["nome"]
        senha = udata["senha"]

        # Busca ou cria usuário
        user = user_repo.buscar_por_login(login)
        if not user:
            senha_hash = gerar_senha_hash(senha)
            user = user_repo.criar_usuario(login=login, senha_hash=senha_hash, situacao="ativo")
            user_repo.atualizar_perfil(login, nome)
            print(f"[+] Usuário criado: {nome} ({login}) - ID {user['id']}")
        else:
            user_repo.atualizar_perfil(login, nome)
            print(f"[*] Usuário já existente: {nome} ({login}) - ID {user['id']}")

        u_id = user["id"]

        # Limpa disciplinas/tarefas prévias para garatinr dados limpos no teste de apresentação
        existing_subjs = disc_repo.listar_por_usuario(u_id)
        for s in existing_subjs:
            disc_repo.excluir(s["id"], u_id)

        # Adiciona matérias, tarefas e sessões
        for sdata in udata["subjects"]:
            sub = disc_repo.criar(
                usuario_id=u_id,
                nome=sdata["nome"],
                professor=sdata["professor"],
                carga_horaria=sdata["carga_horaria"],
                descricao=sdata["descricao"],
                data_inicio=sdata["data_inicio"],
                data_fim=sdata["data_fim"],
                cor=sdata["cor"]
            )
            sub_id = sub["id"]
            print(f"  - Disciplina: {sdata['nome']}")

            # Adiciona tarefas
            for tdata in sdata["tasks"]:
                task = task_repo.criar(
                    usuario_id=u_id,
                    disciplina_id=sub_id,
                    titulo=tdata["titulo"],
                    descricao=tdata["descricao"],
                    prazo=tdata["prazo"],
                    status=tdata["status"]
                )
                print(f"      * Tarefa: {tdata['titulo']} [{tdata['status']}]")

            # Adiciona sessões de estudo
            for ssdata in sdata["sessions"]:
                sess = sess_repo.criar(
                    usuario_id=u_id,
                    disciplina_id=sub_id,
                    titulo_licao=ssdata["titulo"],
                    duracao_segundos=ssdata["duracao"],
                    iniciado_em="2026-10-01T14:00:00Z",
                    finalizado_em="2026-10-01T15:00:00Z"
                )
                print(f"      * Sessao: {ssdata['titulo']} ({ssdata['duracao']}s)")

    print("\n[OK] Semeadura de dados de apresentacao concluida com sucesso!")

if __name__ == "__main__":
    seed_demo_data()
