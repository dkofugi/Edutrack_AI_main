import unittest
import json
import urllib.request
from backend.disciplina_repository import DisciplinaRepository
from backend.tarefa_repository import TarefaRepository

class TestPhase1Migration(unittest.TestCase):
    def setUp(self):
        self.disc_repo = DisciplinaRepository()
        self.task_repo = TarefaRepository()

    def test_disciplina_repository(self):
        d = self.disc_repo.criar(usuario_id=1, nome="Matemática Discreta", carga_horaria=60)
        self.assertIsNotNone(d["id"])
        self.assertEqual(d["nome"], "Matemática Discreta")

        list_d = self.disc_repo.listar_por_usuario(1)
        self.assertTrue(any(x["id"] == d["id"] for x in list_d))

        deleted = self.disc_repo.excluir(d["id"], 1)
        self.assertTrue(deleted)

    def test_tarefa_repository(self):
        d = self.disc_repo.criar(usuario_id=1, nome="Física I", carga_horaria=40)
        t = self.task_repo.criar(usuario_id=1, disciplina_id=d["id"], titulo="Lab 1")
        self.assertIsNotNone(t["id"])
        self.assertEqual(t["titulo"], "Lab 1")

        list_t = self.task_repo.listar_por_usuario(1)
        self.assertTrue(any(x["id"] == t["id"] for x in list_t))

        self.disc_repo.excluir(d["id"], 1)

if __name__ == "__main__":
    unittest.main()
