exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        system: body.system,
        messages: body.messages
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Si el texto contiene el resumen, enviamos el email
    if (text.includes("===INICIO===") && text.includes("===FIN===")) {
      const start = text.indexOf("===INICIO===") + 12;
      const end = text.indexOf("===FIN===");
      const resumen = text.substring(start, end).trim();

      const nombre = (resumen.match(/NOMBRE:\s*(.+)/) || [])[1] || "Sin nombre";

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: "fermanelli.asoc@gmail.com",
          subject: `Amparo de Salud — Nuevo caso: ${nombre}`,
          text: `NUEVO CASO — FERMANELLI & ASOC\n${"─".repeat(40)}\n\n${resumen}\n\n${"─".repeat(40)}\nGenerado automáticamente.`
        })
      });
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
