insert into public.modalidades (nome, icone, usa_gps, descricao)
values
  ('Corrida', 'run', true, 'Atividade de corrida ao ar livre'),
  ('Caminhada', 'walk', true, 'Caminhada leve'),
  ('Basquete', 'basketball', false, 'Treino em quadra'),
  ('Ciclismo', 'bike', true, 'Ciclismo em rota aberta'),
  ('Musculacao', 'dumbbell', false, 'Treino em academia'),
  ('Natacao', 'swim', false, 'Treino em piscina')
on conflict (nome) do update set
  icone = excluded.icone,
  usa_gps = excluded.usa_gps,
  descricao = excluded.descricao;

insert into public.locais (modalidade_id, nome, cidade, categoria, nivel, tipo, icone, latitude, longitude, endereco, descricao, horario, url)
values
  ((select id from public.modalidades where nome = 'Caminhada'), 'Parque Central', 'Diadema', 'Parque', 'Iniciante', 'Parque', 'tree-outline', -23.681500, -46.620500, 'Av. Principal, 100', 'Area verde com pista de caminhada.', '06:00-22:00', 'https://maps.google.com'),
  ((select id from public.modalidades where nome = 'Basquete'), 'Quadra Municipal', 'Diadema', 'Quadra', 'Intermediario', 'Quadra', 'basketball', -23.680200, -46.623100, 'Rua das Flores, 45', 'Quadra aberta com iluminacao noturna.', '07:00-21:00', 'https://maps.google.com'),
  ((select id from public.modalidades where nome = 'Corrida'), 'Pista de Corrida', 'Diadema', 'Pista', 'Intermediario', 'Pista', 'run', -23.679100, -46.618900, 'Av. Esportes, 200', 'Pista asfaltada com 2 km.', '05:30-22:00', 'https://maps.google.com')
;

insert into public.dicas (modalidade_id, titulo, subtitulo, youtube_url, alongamento, aquecimento, como_praticar, icone, cor)
values
  ((select id from public.modalidades where nome = 'Corrida'), 'Corrida', 'Tecnica e ritmo para evoluir', 'https://www.youtube.com/watch?v=9MqGN09LEpY', 'Alongue panturrilhas e quadriceps.', '5 a 10 min de caminhada rapida.', 'Controle o ritmo e a postura.', 'run-fast', '#10B981'),
  ((select id from public.modalidades where nome = 'Ciclismo'), 'Ciclismo', 'Postura e seguranca', 'https://www.youtube.com/watch?v=9MqGN09LEpY', 'Alongue quadriceps e lombar.', 'Pedale leve por 10 min.', 'Ajuste o selim corretamente.', 'bike', '#3B82F6'),
  ((select id from public.modalidades where nome = 'Caminhada'), 'Caminhada', 'Ritmo e respiracao', 'https://www.youtube.com/watch?v=9MqGN09LEpY', 'Alongue panturrilhas e gluteos.', 'Comece em ritmo leve.', 'Postura ereta e passadas regulares.', 'walk', '#F59E0B')
;