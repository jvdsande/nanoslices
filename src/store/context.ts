export const Context = {
  service: {
    getNumber(id?: string, param?: any) {
      return new Promise<{
        id?: string,
        param?: any,
        value: number
      }>((resolve) =>
        setTimeout(
          () => resolve({ id, param, value: Math.random() * 100 }),
          Math.random() * 3000,
        ),
      )
    },
    getString() {
      return new Promise<string>((resolve) =>
        setTimeout(() => resolve('hello world'), Math.random() * 5000),
      )
    },
  },
}
