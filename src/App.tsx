import React, { useCallback, useEffect, useRef, useState } from "react";

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

const Canvas = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
        }}
      />
      <PointerEvent
        target={ref}
        type="pointermove"
        handler={({
          pressure,
          tangentialPressure,
          tiltX,
          tiltY,
          twist,
          width,
          height,
          pointerId,
        }) => {
          if (!isDrawing) {
            return;
          }

          console.log(
            `{
              pressure,
              tangentialPressure,
              tiltX,
              tiltY,
              twist,
              width,
              height,
              pointerId,
            }`,
            {
              pressure,
              tangentialPressure,
              tiltX,
              tiltY,
              twist,
              width,
              height,
              pointerId,
            }
          );
        }}
      />
      <PointerEvent
        target={ref}
        type={["pointerup"]}
        handler={() => {
          setIsDrawing(false);
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
