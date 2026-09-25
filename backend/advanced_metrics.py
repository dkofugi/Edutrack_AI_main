import datetime
from typing import List, Dict, Any

def calcular_progresso_ponderado(disciplinas: List[Dict[str, Any]]) -> float:
    """
    Calcula o progresso global ponderado pela carga horária.
    
    Cada disciplina no formato:
    {
        'workload_hours': int,
        'progress_percent': float (0 a 100)
    }
    """
    carga_total = 0
    progresso_total = 0.0
    
    for disc in disciplinas:
        carga = disc.get('workload_hours', 0)
        progresso = disc.get('progress_percent', 0.0)
        
        carga_total += carga
        progresso_total += progresso * carga
        
    if carga_total == 0:
        return 0.0
        
    return round(progresso_total / carga_total, 2)


def estimar_conclusao(tarefas_concluidas: int, dias_estudados: int, tarefas_pendentes: int) -> int:
    """
    Estima os dias restantes para concluir as tarefas com base na velocidade atual de estudo.
    
    Returns:
        Dias estimados para conclusão (-1 se não houver tarefas concluídas ou dias).
    """
    if dias_estudados <= 0 or tarefas_concluidas <= 0:
        return -1  # Impossível estimar, dados insuficientes
        
    velocidade = tarefas_concluidas / dias_estudados # tarefas por dia
    
    if velocidade == 0:
        return -1
        
    dias_restantes = tarefas_pendentes / velocidade
    return round(dias_restantes)

if __name__ == "__main__":
    # Testes simples
    disciplinas_mock = [
        {'nome': 'Matemática', 'workload_hours': 60, 'progress_percent': 50},
        {'nome': 'Física', 'workload_hours': 40, 'progress_percent': 20}
    ]
    # Esperado: (60*50 + 40*20) / 100 = (3000 + 800) / 100 = 38%
    print(f"Progresso Ponderado: {calcular_progresso_ponderado(disciplinas_mock)}%")
    
    # 10 tarefas feitas em 5 dias. Restam 20. Velocidade: 2 por dia. Restam 10 dias.
    dias = estimar_conclusao(10, 5, 20)
    print(f"Dias estimados para conclusão: {dias} dias")
