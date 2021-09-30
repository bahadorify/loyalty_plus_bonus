import Redis from "ioredis";

Redis.Command.setArgumentTransformer("hmset", (args) => {
  // convert object to flat array
  if (args.length === 2) {
    if (typeof args[1] === "object" && args[1] !== null) {
      return [args[0]].concat(convertObjectToArray(args[1]));
    }
  }
  return args;
});

const redis = new Redis({
  port: "6379",
  host: "127.0.0.1",
  password: "foobared",
});

export default redis;

// HELPER FUNCTIONS
// ****************
function convertObjectToArray(obj) {
  const arr = [];
  for (let key of Object.keys(obj)) {
    let value = obj[key];
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    arr.push(key, value);
  }
  return arr;
}
