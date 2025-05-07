const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Events, Query } = Matter;
const engine = Engine.create();
let render; // ← 렌더 전역 변수로 분리!

let currentKey = "start";
let data = {};

fetch("data.json")
  .then((response) => response.json())
  .then((json) => {
    data = json;
    showMemory("start");
  })
  .catch((error) => {
    console.error("JSON 불러오기 실패: ", error);
  });

engine.gravity.x = 0.25;
engine.gravity.y = 0.3;

function showMemory(key) {
  const memory = data.memories[key];
  currentKey = key;

  const app = document.getElementById("app");
  const realBox = document.getElementById("real-box");
  const boxRect = realBox.getBoundingClientRect();

  app.style.backgroundImage = `url(${memory.bg})`;

  if (!render) {
    // 렌더가 처음 한 번만 생성됨!
    render = Render.create({
      element: app,
      engine: engine,
      options: {
        width: boxRect.width,
        height: boxRect.height,
        wireframes: false,
        background: "transparent"
      }
    });
    Render.run(render);
    Engine.run(engine);
  }

  // 기존 월드 초기화
  World.clear(engine.world);
  
  const angle = Math.PI / 20;
  const ground = Bodies.rectangle(
    boxRect.width / 2,
    boxRect.height + 0,
    boxRect.width * 2,
    60,
    {
      isStatic: true,
      angle: angle,
      render: {
        fillStyle: "transparent",
        strokeStyle: "transparent"
      }
    }
  );
  World.add(engine.world, [ground]);

  const words = memory.text.split(/\s+/);
  words.forEach((word, i) => {
    setTimeout(() => {
      const { dataURL, width, height } = createTextImage(word);
      const startX = 0 + Math.random() * 40;
      const startY = 0 + Math.random() * 40;

      const body = Matter.Bodies.rectangle(
        startX,
        startY,
        width,
        height,
        {
          restitution: 0.6,
          friction: 0.1,
          render: {
            sprite: {
              texture: dataURL,
              xScale: 1,
              yScale: 1
            }
          }
        }
      );
      World.add(engine.world, body);
    }, i * 1300);
  });

  // 아이콘 추가
  setTimeout(() => {
    const iconSrcs = memory.icon || ["default.png"];
    iconSrcs.forEach((src) => {
      const iconImg = new Image();
      iconImg.src = `assets/icons/${src}`;

      iconImg.onload = () => {
        const scale = 0.05;
        const width = iconImg.width * scale;
        const height = iconImg.height * scale;

        const startX = 0 + Math.random() * 40;
        const startY = 0 + Math.random() * 40;

        const iconBody = Bodies.rectangle(
          startX,
          startY,
          width,
          height,
          {
            restitution: 0.8,
            friction: 0.2,
            render: {
              sprite: {
                texture: iconImg.src,
                xScale: scale,
                yScale: scale
              }
            }
          }
        );

        iconBody.nextKey = memory.next[0];
        World.add(engine.world, iconBody);
      };
    });
  }, words.length * 1300 + 500);

  // 마우스 컨트롤러는 한번만 추가되게
  if (!engine._mouseAdded) {
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    });
    World.add(engine.world, mouseConstraint);

    Events.on(mouseConstraint, 'mousedown', function(event) {
      const mousePosition = event.mouse.position;
      const clickedBodies = Query.point(engine.world.bodies, mousePosition);
      clickedBodies.forEach(body => {
        if (body.nextKey) {
          showMemory(body.nextKey); // 다시 호출!
        }
      });
    });

    engine._mouseAdded = true;
  }

  // 아이콘 영역 초기화
  document.getElementById("icons-container").innerHTML = "";
}

function createTextImage(text, padding = 8, fontSize = 7) {
  const ratio = window.devicePixelRatio || 1;
  const font = `${fontSize}px 'ChosunGu'`;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.font = font;
  const textWidth = measureCtx.measureText(text).width;

  const width = textWidth + padding * 2;
  const height = fontSize + padding * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.fillStyle = "black";
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.fillText(text, padding, padding);

  return {
    dataURL: canvas.toDataURL(),
    width,
    height
  };
}

document.getElementById("home-button").addEventListener("click", () => {
  window.location.reload(); // 홈버튼 새로고침
});
