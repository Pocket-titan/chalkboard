import React, { useCallback, useEffect, useRef, useState } from "react";
import create, { State, StateCreator } from "zustand";
import produce from "immer";

const immer = <T extends State>(
  config: StateCreator<T, (fn: (draft: T) => void) => void>
): StateCreator<T> => (set, get, api) =>
  config((fn) => set(produce(fn) as (state: T) => T), get, api);

type FilteredKeys<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

type PointerEvents = FilteredKeys<DocumentEventMap, PointerEvent>;

const PointerEvent = <K extends PointerEvents>({
  type,
  handler,
  target,
  pointerType = undefined,
  passive = undefined,
  capture = false,
}: {
  target: React.RefObject<HTMLElement>;
  type: K | K[];
  handler: (event: DocumentEventMap[K]) => void;
  pointerType?: "mouse" | "pen" | "touch";
  passive?: boolean;
  capture?: boolean;
}) => {
  let fn = useCallback(
    (event: DocumentEventMap[K]) => {
      if (pointerType && pointerType !== event.pointerType) {
        return;
      }

      if (passive === false) {
        event.preventDefault();
      }

      handler(event);
    },
    [handler, passive, pointerType]
  );

  useEffect(() => {
    let el = target.current;
    if (!el) {
      return;
    }

    if (type instanceof Array) {
      type.forEach((t) => el!.addEventListener(t, fn, { capture }));

      return () => {
        type.forEach((t) => el!.removeEventListener(t, fn, { capture }));
      };
    }

    el.addEventListener(type, fn, { capture });

    return () => {
      el!.removeEventListener(type, fn, { capture });
    };
  }, [target, fn, type, capture, passive]);

  return null;
};

type ToolName = "pencil";

type Point = { x: number; y: number };

type Path = {
  points: Point[];
  color: string;
};

const useStore = create<{
  tool: ToolName;
  paths: Path[];
  currentPath: Path | null;
  addPath: (path: Path) => void;
  setState: (newState: Partial<{}>) => void;
}>(
  immer((set, get) => ({
    tool: "pencil",
    paths: [],
    currentPath: null,
    addPath: (path) => {
      set((draft) => {
        draft.paths.push(path);
      });
    },
    setState: (newState) => {
      set((draft: any) => {
        Object.entries(newState).forEach(([k, v]) => {
          draft[k] = v;
        });
      });
    },
  }))
);

const Canvas = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Path | null>(null);

  const onPointerDown = (point: any) => {
    let currentPath = {
      type: "pencil",
      color: "blue",
      data: [point],
    };
  };

  const onPointerMove = () => {};

  const onPointerUp = () => {};

  return (
    <div
      ref={ref}
      style={{
        touchAction: "none",
        height: "100%",
        width: "100%",
        backgroundColor: "hsl(28.57, 55.84%, 80.2%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 15,
          left: "calc(50% - 10px)",
          height: 20,
          width: 20,
          borderRadius: "50%",
          backgroundColor: isDrawing ? "seagreen" : "sienna",
          transition: "all 100ms ease-in-out",
        }}
      />
      <PointerEvent
        target={ref}
        type="pointerdown"
        handler={({
          clientX,
          clientY,
          pressure,
          tangentialPressure,
          tiltX,
          tiltY,
          twist,
          width,
          height,
          pointerId,
        }) => {
          setIsDrawing(true);
          ref.current?.setPointerCapture(pointerId);
          setCurrentPath({
            points: [{ x: clientX, y: clientY }],
            color: "blue",
          });
        }}
      />
      <PointerEvent
        target={ref}
        type="pointermove"
        handler={({
          clientX,
          clientY,
          pressure,
          tangentialPressure,
          tiltX,
          tiltY,
          twist,
          width,
          height,
          pointerId,
        }) => {
          if (!isDrawing || !currentPath) {
            return;
          }

          setCurrentPath({
            ...currentPath,
            points: [
              ...currentPath.points,
              {
                x: clientX,
                y: clientY,
              },
            ],
          });
        }}
      />
      <PointerEvent
        target={ref}
        type={["pointerup"]}
        handler={() => {
          setIsDrawing(false);
          setPaths([...paths, currentPath!]);
          setCurrentPath(null);
        }}
      />
      <PointerEvent
        target={ref}
        type="pointercancel"
        capture
        handler={() => {
          console.log("Cancelled!");
        }}
      />
      {/* <PointerEvent
        target={ref}
        type="lostpointercapture"
        handler={(event) => {
          setIsDrawing(false);
        }}
      /> */}
      <svg style={{ width: "100%", height: "100%" }}>
        {(currentPath ? [...paths, currentPath] : paths).map(
          ({ points, color }) => {
            let [first, ...rest] = points;
            return (
              <path
                fill="none"
                stroke="blue"
                strokeWidth={10}
                d={`M ${first.x},${first.y} ${rest.map(
                  ({ x, y }) => `L ${x},${y}`
                )}`}
              />
            );
          }
        )}
      </svg>
    </div>
  );
};

const App = () => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
      }}
    >
      <Canvas />
    </div>
  );
};

export default App;
