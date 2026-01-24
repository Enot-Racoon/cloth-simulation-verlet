type EventDefinition<Payload, Result = void> = {
  payload: Payload;
  result: Result;
};

type EventMap = Record<string, EventDefinition<any, any>>;

type Handler<Payload, Result> = (payload: Payload) => Result | Promise<Result>;

type Unsubscribe = () => void;

export const createEventBus = <Events extends EventMap>() => {
  type EventName = keyof Events & string;

  const handlers = new Map<EventName, Set<Handler<any, any>>>();

  const on = <E extends EventName>(
    event: E,
    handler: Handler<Events[E]["payload"], Events[E]["result"]>
  ): Unsubscribe => {
    let set = handlers.get(event);

    if (!set) {
      set = new Set();
      handlers.set(event, set);
    }

    set.add(handler);

    return () => {
      set?.delete(handler);
      if (set?.size === 0) {
        handlers.delete(event);
      }
    };
  };

  const once = <E extends EventName>(
    event: E,
    handler: Handler<Events[E]["payload"], Events[E]["result"]>
  ): Unsubscribe => {
    const wrapped: Handler<Events[E]["payload"], Events[E]["result"]> = async (
      payload
    ) => {
      unsubscribe();
      return handler(payload);
    };

    const unsubscribe = on(event, wrapped);
    return unsubscribe;
  };

  const emit = async <E extends EventName>(
    event: E,
    payload: Events[E]["payload"]
  ): Promise<Array<Events[E]["result"]>> => {
    const set = handlers.get(event);
    if (!set) return [];

    const results: Array<Events[E]["result"]> = [];

    for (const handler of set) {
      results.push(await handler(payload));
    }

    return results;
  };

  const clear = (event?: EventName) => {
    if (event) {
      handlers.delete(event);
    } else {
      handlers.clear();
    }
  };

  return {
    on,
    once,
    emit,
    clear,
  };
};
