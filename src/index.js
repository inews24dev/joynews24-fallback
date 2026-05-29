/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
async function R404(request, env) {
	const url = new URL(request.url);
	const html = await env.ASSETS.fetch(new Request(new URL("/404.html", request.url)));
	let text = await html.text();
	text = text.replace("{{path}}", url.pathname + url.search);
	return new Response(text, {
	  status: 404,
	  headers: { "Content-Type": "text/html;charset=UTF-8" }
	});
}

function dateFormt(date) {
	const isoFormat = date.replace(
	  /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
	  "$1-$2-$3T$4:$5:$6"
	);
	const dateObj = new Date(isoFormat);
	const formatted = dateObj.toLocaleString("ko-KR", {
	  year: "numeric",
	  month: "2-digit",
	  day: "2-digit",
	  hour: "2-digit",
	  minute: "2-digit",
	  hour12: true
	});
	return formatted;
}

export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);
			const serial = url.searchParams.get("g_serial");
			if (url.pathname !== "/") {
			  return await env.ASSETS.fetch(request);
			}
			if (!serial) return R404(request, env);
			const dataset = await env.G_CONTENT.get(serial);
			if (!dataset) return R404(request, env);
			const content = JSON.parse(dataset);
			const res = await env.ASSETS.fetch(request);
			const g_title = content.g_title;
			const g_content = content.g_content;
			const g_pdate = dateFormt(content.g_pdate);
			let time = `입력 ${g_pdate}`;
			if (content.g_edate) {
			  const g_edate = dateFormt(content.g_edate);
			  time = `${time} , 수정 ${g_edate}`;
			}
			const g_find = (content.g_find ?? "").replace(/\r?\n/g, "<br>");

			return new HTMLRewriter().on("title", {
			  element(el) {
				el.setInnerContent(g_title, {
				  html: true
				});
			  }
			}).on("h1", {
			  element(el) {
				el.setInnerContent(g_title, {
				  html: true
				});
			  }
			}).on("h2", {
			  element(el) {
				el.setInnerContent(g_find, {
				  html: true
				});
			  }
			}).on("time", {
			  element(el) {
				el.setInnerContent(time, {
				  html: true
				});
			  }
			}).on("article", {
			  element(el) {
				el.setInnerContent(g_content, {
				  html: true
				});
			  }
			}).transform(res);
		} catch (e) {
			console.log("\uC5D0\uB7EC:", e.message);
			return new Response(e.message, { status: 500 });
		}

	},
};
