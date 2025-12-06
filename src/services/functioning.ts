export const close = async (
  symbol: any,
  id: any,
  stock_name: any,
  quantity: any,
  price: any,
  close_price: any,
  type: any
) => {
  console.log(
    "close",
    symbol,
    id,
    stock_name,
    quantity,
    price,
    close_price,
    type
  );
  const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: id,
      symbol,
      stock_name,
      quantity,
      price,
      close_price,
      type,
    }),
  });
  return response.json();
};

export const buy = async (
  userId: any,
  symbol: any,
  quantity: any,
  price: any
) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId,
      symbol: symbol,
      quantity: Number(quantity),
      price: Number(price),
    }),
  });

  return response.json();
};

export const sell = async (
  userId: any,
  symbol: any,
  quantity: any,
  price: any
) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sell`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId,
      symbol: symbol,
      quantity: Number(quantity),
      price: Number(price),
    }),
  });

  return response.json();
};
