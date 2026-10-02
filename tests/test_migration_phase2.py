import unittest
from backend.disciplina_repository import DisciplinaRepository
from backend.tarefa_repository import TarefaRepository
from backend.sessao_repository import SessaoRepository

class TestPhase2Migration(unittest.TestCase):
    def setUp(self):
        self.disc_repo = DisciplinaRepository()
        self.task_repo = TarefaRepository()
        self.sess_repo = SessaoRepository()

    def test_sessao_repository(self):
        d = self.disc_repo.criar(usuario_id=1, nome="Álgebra Linear", carga_horaria=60)
        t = self.task_repo.criar(usuario_id=1, disciplina_id=d["id"], titulo="Estudo de Matrizes")
        
        s = self.sess_repo.criar(
            usuario_id=1,
            disciplina_id=d["id"],
            tarefa_id=t["id"],
            titulo_licao="Resolução de Exercícios Matrizes",
            duracao_segundos=1200,
            iniciado_em="2026-10-02T10:00:00Z",
            finalizado_em="2026-10-02T10:20:00Z"
        )
        self.assertIsNotNone(s["id"])
        self.assertEqual(s["duracao_segundos"], 1200)

        list_s = self.sess_repo.listar_por_usuario(1, d["id"])
        self.assertTrue(any(x["id"] == s["id"] for x in list_s))

        # Cleanup
        self.disc_repo.excluir(d["id"], 1)

if __name__ == "__main__":
    unittest.main()
