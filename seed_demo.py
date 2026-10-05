"""
EduTrack AI — Seed Script para Povoamento de Dados de Exemplo
Popula 3 usuários de demonstração no PostgreSQL:
- gabrielsousa@gmail.com (13 tarefas, 5 disciplinas, sessões de estudo)
- davidourado@gmail.com (10 tarefas, 4 disciplinas, sessões de estudo)
- danilokofugi@gmail.com (9 tarefas, 4 disciplinas, sessões de estudo)
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from backend.repository import UsuarioRepository
from backend.auth_service import AuthService
from backend.disciplina_repository import DisciplinaRepository
from backend.tarefa_repository import TarefaRepository
from backend.sessao_repository import SessaoRepository

REPO = UsuarioRepository()
AUTH = AuthService(repository=REPO)
DISC_REPO = DisciplinaRepository()
TAREFA_REPO = TarefaRepository()
SESSAO_REPO = SessaoRepository()

print(f"[+] Conexão com PostgreSQL ativa: {REPO.use_postgres}")

USERS_DATA = [
    {
        "email": "gabrielsousa@gmail.com",
        "name": "Gabriel Sousa",
        "disciplinas": [
            {"nome": "Algoritmos e Estrutura de Dados", "professor": "Prof. Dr. Ricardo Silva", "carga_horaria": 80, "cor": "#10b981"},
            {"nome": "Engenharia de Software", "professor": "Profa. Dra. Helena Castro", "carga_horaria": 60, "cor": "#3b82f6"},
            {"nome": "Sistemas Operacionais", "professor": "Prof. Carlos Eduardo", "carga_horaria": 80, "cor": "#8b5cf6"},
            {"nome": "Banco de Dados Avançado", "professor": "Profa. Fernanda Lima", "carga_horaria": 60, "cor": "#f59e0b"},
            {"nome": "Inteligência Artificial", "professor": "Prof. Roberto Mendes", "carga_horaria": 60, "cor": "#ec4899"},
        ],
        "tarefas": [
            # Algoritmos
            {"d_idx": 0, "titulo": "Impl. Árvore AVL em C++", "desc": "Implementar rotações à esquerda e direita com testes", "prazo": "2026-10-07", "status": "pending", "estimated": 120},
            {"d_idx": 0, "titulo": "Lista de Exercícios 3: Grafos", "desc": "Algoritmos de Dijkstra e Kruskal", "prazo": "2026-10-10", "status": "in_progress", "estimated": 90},
            {"d_idx": 0, "titulo": "Relatório de Complexidade Algorítmica", "desc": "Análise assintótica Big-O", "prazo": "2026-10-02", "status": "completed", "estimated": 60},
            # Engenharia
            {"d_idx": 1, "titulo": "Diagrama de Casos de Uso", "desc": "Mapear atores e fluxos principais", "prazo": "2026-10-08", "status": "pending", "estimated": 45},
            {"d_idx": 1, "titulo": "Especificação de Requisitos IEEE", "desc": "Requisitos funcionais e não-funcionais", "prazo": "2026-10-12", "status": "in_progress", "estimated": 90},
            {"d_idx": 1, "titulo": "Documento de Arquitetura C4", "desc": "Diagrama de contexto e containers", "prazo": "2026-09-28", "status": "completed", "estimated": 120},
            # Sistemas Operacionais
            {"d_idx": 2, "titulo": "Simulação de Escalonamento CPU", "desc": "Algoritmos Round Robin e SJF", "prazo": "2026-10-06", "status": "pending", "estimated": 150},
            {"d_idx": 2, "titulo": "Estudo Dirigido: Memória Virtual", "desc": "Paginação, paginação por demanda e TLB", "prazo": "2026-10-14", "status": "pending", "estimated": 60},
            {"d_idx": 2, "titulo": "Artigo: Threading vs Processos", "desc": "Comparativo de concorrência em Linux", "prazo": "2026-09-30", "status": "completed", "estimated": 45},
            # Banco de Dados
            {"d_idx": 3, "titulo": "Modelagem E-R do Sistema EduTrack", "desc": "Diagrama conceitual e lógico", "prazo": "2026-10-09", "status": "in_progress", "estimated": 90},
            {"d_idx": 3, "titulo": "Script SQL Triggers & Stored Procedures", "desc": "Automação de auditoria", "prazo": "2026-10-15", "status": "pending", "estimated": 120},
            # Inteligência Artificial
            {"d_idx": 4, "titulo": "Implementação Rede Neural Perceptron", "desc": "Treinamento com algoritmo Backpropagation", "prazo": "2026-10-11", "status": "in_progress", "estimated": 180},
            {"d_idx": 4, "titulo": "Resumo Teórico: Busca A* e Heurísticas", "desc": "Estudo de algoritmos de busca informada", "prazo": "2026-09-25", "status": "completed", "estimated": 60}
        ],
        "sessoes": [
            {"d_idx": 0, "titulo": "Estudo de Árvores Balanceadas", "duracao": 3600},
            {"d_idx": 0, "titulo": "Prática de Algoritmo Dijkstra", "duracao": 2700},
            {"d_idx": 1, "titulo": "Modelagem UML de Sistemas", "duracao": 4200},
            {"d_idx": 2, "titulo": "Estudo de Escalonamento de Processos", "duracao": 5400},
            {"d_idx": 3, "titulo": "Criação de Tabelas e Chaves Estrangeiras", "duracao": 3000},
            {"d_idx": 4, "titulo": "Conceitos de Redes Neurais e Pesos", "duracao": 4800}
        ]
    },
    {
        "email": "davidourado@gmail.com",
        "name": "Davi Dourado",
        "disciplinas": [
            {"nome": "Cálculo Diferencial e Integral III", "professor": "Prof. Dr. Marcos Antonio", "carga_horaria": 90, "cor": "#ef4444"},
            {"nome": "Física Geral e Experimental II", "professor": "Prof. Paulo Henrique", "carga_horaria": 80, "cor": "#f97316"},
            {"nome": "Geometria Analítica e Álgebra Linear", "professor": "Profa. Camila Torres", "carga_horaria": 60, "cor": "#10b981"},
            {"nome": "Métodos Numéricos", "professor": "Prof. André Santos", "carga_horaria": 60, "cor": "#06b6d4"}
        ],
        "tarefas": [
            # Cálculo III
            {"d_idx": 0, "titulo": "Lista 4: Integrais Triplas e Superfície", "desc": "Teorema de Stokes e Gauss", "prazo": "2026-10-07", "status": "pending", "estimated": 180},
            {"d_idx": 0, "titulo": "Preparação para P2 de Cálculo", "desc": "Revisão de equações diferenciais", "prazo": "2026-10-13", "status": "in_progress", "estimated": 240},
            {"d_idx": 0, "titulo": "Exercícios Séries de Fourier", "desc": "Séries trigonométricas e ortogonalidade", "prazo": "2026-09-29", "status": "completed", "estimated": 90},
            # Física II
            {"d_idx": 1, "titulo": "Relatório 2: Campo Magnético Solenoide", "desc": "Dados do experimento no laboratório", "prazo": "2026-10-06", "status": "pending", "estimated": 120},
            {"d_idx": 1, "titulo": "Resolução da Ficha de Circuitos RLC", "desc": "Ressonância e impedância complexa", "prazo": "2026-10-11", "status": "in_progress", "estimated": 90},
            {"d_idx": 1, "titulo": "Experimento de Indução Eletromagnética", "desc": "Lei de Faraday e Lenz", "prazo": "2026-09-27", "status": "completed", "estimated": 60},
            # Álgebra Linear
            {"d_idx": 2, "titulo": "Espaços Vetoriais e Autovalores", "desc": "Diagonalização de matrizes", "prazo": "2026-10-09", "status": "pending", "estimated": 120},
            {"d_idx": 2, "titulo": "Matriz de Transformação Linear", "desc": "Núcleo e imagem de transformação", "prazo": "2026-10-01", "status": "completed", "estimated": 60},
            # Métodos Numéricos
            {"d_idx": 3, "titulo": "Método de Newton-Raphson em Python", "desc": "Implementar determinação de raízes", "prazo": "2026-10-08", "status": "in_progress", "estimated": 90},
            {"d_idx": 3, "titulo": "Interpolação Polinomial de Lagrange", "desc": "Ajuste de curvas com pontos amostrados", "prazo": "2026-10-16", "status": "pending", "estimated": 120}
        ],
        "sessoes": [
            {"d_idx": 0, "titulo": "Resolução de Integrais Duplas e Triplas", "duracao": 5400},
            {"d_idx": 1, "titulo": "Estudo de Leis de Maxwell e Campo Elétrico", "duracao": 3600},
            {"d_idx": 2, "titulo": "Exercícios de Autovetores e Base Vetorial", "duracao": 4200},
            {"d_idx": 3, "titulo": "Programação de Métodos de Eliminação Gaussiana", "duracao": 3000}
        ]
    },
    {
        "email": "danilokofugi@gmail.com",
        "name": "Danilo Kofugi",
        "disciplinas": [
            {"nome": "Desenvolvimento Web Fullstack", "professor": "Prof. Lucas Rocha", "carga_horaria": 80, "cor": "#10b981"},
            {"nome": "Arquitetura de Computadores", "professor": "Profa. Juliana Paes", "carga_horaria": 60, "cor": "#3b82f6"},
            {"nome": "Segurança da Informação", "professor": "Prof. Marcelo Ramos", "carga_horaria": 60, "cor": "#8b5cf6"},
            {"nome": "Redes de Computadores", "professor": "Prof. Tiago Faria", "carga_horaria": 80, "cor": "#f59e0b"}
        ],
        "tarefas": [
            # Dev Web
            {"d_idx": 0, "titulo": "Projeto API RESTful com PostgreSQL", "desc": "Construir endpoints CRUD com Python", "prazo": "2026-10-07", "status": "in_progress", "estimated": 240},
            {"d_idx": 0, "titulo": "Componente Dashboard em React/JS", "desc": "Renderizar gráficos interativos e cards", "prazo": "2026-10-10", "status": "pending", "estimated": 180},
            {"d_idx": 0, "titulo": "Deploy da Aplicação no Servidor", "desc": "Configuração de servidor HTTP e socket", "prazo": "2026-09-30", "status": "completed", "estimated": 90},
            # Arquitetura
            {"d_idx": 1, "titulo": "Simulação de Pipeline MIPS", "desc": "Análise de hazards de dados e controle", "prazo": "2026-10-06", "status": "pending", "estimated": 150},
            {"d_idx": 1, "titulo": "Relatório de Cache L1/L2 e Miss Penalty", "desc": "Hierarquia de memória", "prazo": "2026-10-12", "status": "in_progress", "estimated": 90},
            # Segurança
            {"d_idx": 2, "titulo": "Análise de Vulnerabilidades OWASP Top 10", "desc": "Relatório sobre SQL Injection e XSS", "prazo": "2026-10-08", "status": "pending", "estimated": 120},
            {"d_idx": 2, "titulo": "Lab Criptografia Assimétrica RSA", "desc": "Geração de chaves pública e privada", "prazo": "2026-09-28", "status": "completed", "estimated": 90},
            # Redes
            {"d_idx": 3, "titulo": "Configuração de Roteamento OSPF/BGP", "desc": "Simulações de redes em Cisco Packet Tracer", "prazo": "2026-10-14", "status": "in_progress", "estimated": 180},
            {"d_idx": 3, "titulo": "Captura e Análise de Pacotes Wireshark", "desc": "Inspeção de cabeçalhos TCP/IP e HTTP", "prazo": "2026-09-26", "status": "completed", "estimated": 60}
        ],
        "sessoes": [
            {"d_idx": 0, "titulo": "Desenvolvimento Backend e Integração DB", "duracao": 7200},
            {"d_idx": 1, "titulo": "Estudo de Conjunto de Instruções MIPS", "duracao": 3600},
            {"d_idx": 2, "titulo": "Estudo de Protocolos Seguros HTTPS e TLS", "duracao": 4500},
            {"d_idx": 3, "titulo": "Análise de Camadas do Modelo OSI", "duracao": 3600}
        ]
    }
]

def seed_all():
    now = datetime.now(timezone.utc)

    for udata in USERS_DATA:
        email = udata["email"]
        nome = udata["name"]

        # 1. Garante existência do usuário com hash bcrypt
        user = REPO.buscar_por_login(email)
        if not user:
            sucesso, user, msg = AUTH.cadastrar(login=email, senha="123123", situacao="ativo")
            print(f"[+] Usuário cadastrado: {email} (ID: {user['id']})")
        else:
            print(f"[=] Usuário já existente: {email} (ID: {user['id']})")

        uid = user["id"]
        # Atualiza nome de exibição no perfil
        REPO.atualizar_perfil(email, nome)

        # 2. Insere Disciplinas
        created_discs = []
        for d in udata["disciplinas"]:
            # Verifica se já existe por nome para o mesmo usuário
            existing = DISC_REPO.listar_por_usuario(uid)
            found = next((x for x in existing if x["nome"] == d["nome"]), None)
            if not found:
                new_d = DISC_REPO.criar(
                    usuario_id=uid,
                    nome=d["nome"],
                    professor=d["professor"],
                    carga_horaria=d["carga_horaria"],
                    cor=d["cor"]
                )
                created_discs.append(new_d)
            else:
                created_discs.append(found)

        print(f"    - {len(created_discs)} disciplina(s) prontas para {email}")

        # 3. Insere Tarefas
        existing_tasks = TAREFA_REPO.listar_por_usuario(uid)
        task_count = 0
        created_task_objects = []

        for t in udata["tarefas"]:
            disc = created_discs[t["d_idx"]]
            found_t = next((x for x in existing_tasks if x["titulo"] == t["titulo"]), None)
            if not found_t:
                new_t = TAREFA_REPO.criar(
                    usuario_id=uid,
                    disciplina_id=disc["id"],
                    titulo=t["titulo"],
                    descricao=t["desc"],
                    prazo=t["prazo"],
                    status=t["status"]
                )
                task_count += 1
                created_task_objects.append(new_t)
            else:
                created_task_objects.append(found_t)

        print(f"    - {len(created_task_objects)} tarefa(s) ativas no total (novas: {task_count})")

        # 4. Insere Sessões de Estudo
        existing_sess = SESSAO_REPO.listar_por_usuario(uid)
        sess_count = 0

        for s in udata["sessoes"]:
            disc = created_discs[s["d_idx"]]
            found_s = next((x for x in existing_sess if x["titulo_licao"] == s["titulo"]), None)
            if not found_s:
                fin_time = now - timedelta(hours=sess_count * 5)
                ini_time = fin_time - timedelta(seconds=s["duracao"])

                # Associa a uma tarefa concluída se houver
                associated_task = next((t for t in created_task_objects if t["disciplina_id"] == disc["id"]), None)
                associated_task_id = associated_task["id"] if associated_task else None

                SESSAO_REPO.criar(
                    usuario_id=uid,
                    disciplina_id=disc["id"],
                    tarefa_id=associated_task_id,
                    titulo_licao=s["titulo"],
                    duracao_segundos=s["duracao"],
                    iniciado_em=ini_time.isoformat(),
                    finalizado_em=fin_time.isoformat()
                )
                sess_count += 1

        print(f"    - {sess_count} nova(s) sessão(ões) de estudo adicionada(s)")

    print("\n[🎉] Povoamento concluído com sucesso!")

if __name__ == "__main__":
    seed_all()
