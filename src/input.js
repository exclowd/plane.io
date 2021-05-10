let keys = {};

onkeyup = onkeydown = (e) => {
  keys[e.key] = e.type === "keydown";
};

export { keys };
