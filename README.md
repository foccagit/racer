# 🏁 Interlagos Racer

Simulador de corrida 3D do **Autódromo José Carlos Pace (Interlagos)**, feito em Three.js puro, sem bundler. Roda direto no navegador via servidor estático.

## ▶️ Como rodar

```bash
cd /caminho/do/projeto
python3 -m http.server 8000
```

Abrir [http://localhost:8000](http://localhost:8000) no navegador.

> Não funciona com `file://` direto por causa de CORS em ES modules.

## 🎮 Controles

- `↑` acelerar
- `↓` ré / freio
- `←` `→` esterço
- **Mouse drag** no canvas: orbita a câmera ao redor do carro
- **Roda do mouse**: zoom
- Botão **Resetar visão**: volta a câmera padrão

## 🏆 Fluxo de corrida

- Tela inicial com botões **JOGAR** e **RANKING**
- 3 voltas no sentido anti-horário
- Cronômetro de volta atual + lista das anteriores (canto inferior esquerdo)
- Contador de voltas no topo
- Tela de fim com tempos por volta, total, melhor volta destacada e input pra salvar no ranking
- Top 10 persistido em `localStorage`

## 🚧 Regras de pista

- Sair da pista por 2 segundos → respawn no centro do trecho mais próximo
- Andar no sentido contrário → mensagem piscante "SENTIDO ERRADO"; se persistir 4s, respawn
- Lentidão fora da pista (40% velocidade máxima, 50% aceleração, atrito 4×)
- Rastro visual: linhas brancas atrás das rodas traseiras quando off-track, fade em ~5s

## 🏎️ Sobre a pista

Os 120 waypoints da pista foram extraídos amostrando uniformemente o path SVG vetorial oficial do circuito. Cada waypoint tem coordenadas X/Z georreferenciadas e elevação Y aproximada (~20m de desnível total, com a famosa descida do Senna S logo após a largada).

Perímetro: **4.309 km** (idêntico ao circuito real).

## 🧱 Stack

- [Three.js](https://threejs.org/) 0.161 via importmap (CDN)
- ES Modules nativos
- GLTFLoader pro modelo do carro ([Kenney Car Kit](https://kenney.nl/assets/car-kit))
- Web APIs nativas: Canvas 2D pro minimapa e textura de outdoors, localStorage pro ranking

## 📁 Estrutura

```
.
├── index.html        # HTML, importmap, telas de menu/fim
├── style.css         # estilos
├── main.js           # loop principal, física, câmera, input, race flow
├── track.js          # waypoints + Catmull-Rom + asfalto + zebras + minimapa
├── race.js           # estado de corrida (3 voltas) + ranking localStorage
├── trail.js          # rastro visual fora da pista
├── outdoors.js       # outdoors espalhados pelo traçado
├── models/           # race.glb + texturas
└── kenney_car-kit/   # assets do Kenney (não usados em runtime, só race.glb)
```

## 📝 Roadmap

- [ ] Som de motor reativo à velocidade
- [ ] Modelo 3D do carro mais detalhado
- [ ] Adversários controlados por IA
- [ ] Replay/ghost da melhor volta
- [ ] Setores parciais com tempos
- [ ] Versão mobile com controles touch

## 📄 Licença

MIT

## 👤 Autor

Desenvolvido por [@foccagit](https://github.com/foccagit)
