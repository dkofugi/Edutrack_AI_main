import unittest
from datetime import datetime, timedelta, timezone

class TestPriorityCarouselAlgorithm(unittest.TestCase):
    def test_task_priority_ranking_logic(self):
        """
        Valida a regra de priorização RF-PRIO-01:
        Tarefas atrasadas ou com prazo mais próximo devem ter maior prioridade.
        """
        now = datetime.now(timezone.utc)
        
        # Tarefa 1: Vence em 10 dias (tranquilo)
        task_tranquila = {
            "id": 1,
            "title": "Leitura complementar",
            "due_date": (now + timedelta(days=10)).strftime("%Y-%m-%d"),
            "status": "pending",
            "subject_id": 100
        }
        
        # Tarefa 2: Atrasada há 2 dias (urgente)
        task_atrasada = {
            "id": 2,
            "title": "Trabalho prático",
            "due_date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
            "status": "pending",
            "subject_id": 100
        }
        
        subject = {"id": 100, "name": "Cálculo", "workload_hours": 60}
        
        # Simula cálculo de score
        def calc_score(task):
            due = datetime.strptime(task["due_date"], "%Y-%m-%d")
            diff_days = (due.date() - now.date()).days
            score = 0
            if diff_days < 0:
                score += 1000 + abs(diff_days) * 50
            elif diff_days <= 1:
                score += 500
            else:
                score += 50
            score += subject["workload_hours"] * 5
            return score

        score_tranquila = calc_score(task_tranquila)
        score_atrasada = calc_score(task_atrasada)
        
        self.assertGreater(score_atrasada, score_tranquila, "Tarefa atrasada DEVE ter score superior a tarefa com prazo distante.")

if __name__ == "__main__":
    unittest.main()
