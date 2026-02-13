import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";

const DATA_DIR = path.resolve(__dirname, "../data");

const HERO_LIST_URL = "https://pvp.qq.com/web201605/js/herolist.json";
const ITEM_LIST_URL = "https://pvp.qq.com/web201605/js/item.json";
const SUMMONER_LIST_URL = "https://pvp.qq.com/web201605/js/summoner.json";

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1";

const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent": MOBILE_UA,
  },
});

async function downloadFile(url: string, dest: string) {
  try {
    const res = await axiosInstance.get(url, { responseType: "arraybuffer" });
    await fs.outputFile(dest, res.data);
    console.log(`Downloaded: ${url} -> ${dest}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to download ${url}: ${error.message}`);
    return false;
  }
}

async function fetchJson(url: string) {
  const res = await axiosInstance.get(url);
  return res.data;
}

async function fetchHtml(url: string) {
  const res = await axiosInstance.get(url, { responseType: "arraybuffer" });
  // Initial check for encoding, default to GBK as per note
  // However, axios arraybuffer gives raw data.
  // Note mentions: "Page encoding might be GBK".
  const html = iconv.decode(Buffer.from(res.data), "gbk");
  return html;
}

async function processHeroes() {
  console.log("Fetching hero list...");
  const heroList = await fetchJson(HERO_LIST_URL);
  await fs.outputJson(path.join(DATA_DIR, "hero/list.json"), heroList, {
    spaces: 2,
  });

  const targetHeroId = process.argv[2];
  const heroesToProcess = targetHeroId
    ? heroList.filter((h: any) => h.ename.toString() === targetHeroId)
    : heroList;

  if (targetHeroId && heroesToProcess.length === 0) {
    console.error(`Hero with ID ${targetHeroId} not found.`);
    return;
  }

  for (const hero of heroesToProcess) {
    const ename = hero.ename;
    const cname = hero.cname;
    const id_name = hero.id_name;

    console.log(`Processing hero: ${cname} (${ename})`);

    // 1. Download Avatar
    const avatarUrl = `https://game.gtimg.cn/images/yxzj/img201606/heroimg/${ename}/${ename}.jpg`;
    await downloadFile(avatarUrl, path.join(DATA_DIR, `hero/${ename}.jpg`));

    // 2. Fetch Detail
    const detailUrl = `https://pvp.qq.com/web201605/herodetail/m/${id_name}.html`;
    try {
      const html = await fetchHtml(detailUrl);
      const $ = cheerio.load(html);

      // Attributes based on list order as per note
      // 1: Survival, 2: Attack, 3: Skill, 4: Difficulty
      const survivalSpan = $(
        ".hero-cover .cover-list li:nth-child(1) span",
      ).attr("class");
      const attackSpan = $(".hero-cover .cover-list li:nth-child(2) span").attr(
        "class",
      );
      const skillSpan = $(".hero-cover .cover-list li:nth-child(3) span").attr(
        "class",
      );
      const difficultySpan = $(
        ".hero-cover .cover-list li:nth-child(4) span",
      ).attr("class");

      const heroTypeMap: any = {
        1: "战士",
        2: "法师",
        3: "坦克",
        4: "刺客",
        5: "射手",
        6: "辅助",
      };
      let occupation = heroTypeMap[hero.hero_type] || "";

      // If mapped value is empty, try parsing HTML (though list data should be reliable)
      if (!occupation) {
        occupation = $(".hero-location").text().trim();
        if (occupation.includes("游戏职业：")) {
          occupation = occupation.replace("游戏职业：", "");
        }
      }

      const heroDetail: any = {
        ename,
        cname,
        title: $(".hero-title").text().trim(),
        occupation,
        attributes: {
          survival: survivalSpan?.match(/hero-attr1-(\d+)/)?.[1],
          attack: attackSpan?.match(/hero-attr2-(\d+)/)?.[1],
          skill: skillSpan?.match(/hero-attr3-(\d+)/)?.[1],
          difficulty: difficultySpan?.match(/hero-attr4-(\d+)/)?.[1],
        },
        skins:
          $(".hero-skin")
            .data("imgname")
            ?.toString()
            .split("|")
            .map((s: string) => {
              const parts = s.split("&");
              return { name: parts[0], id: parts[1] };
            }) || [],
        skills: [],
      };

      // Skills
      // Icons: .plus-tab li img src
      // Info: .plus-content li
      const skillIcons: string[] = [];
      $(".plus-tab li img").each((i: number, el: any) => {
        skillIcons.push($(el).attr("src") || "");
      });

      $(".plus-content li").each((i: number, el: any) => {
        const name = $(el).find(".plus-name").text().trim();
        if (!name) return; // Skip empty skills

        const value = $(el).find(".plus-value").text().trim(); // (冷却值：... 消耗：...)
        const desc = $(el).find(".plus-int").text().trim();
        const tip = $(el).find(".prompt").text().trim();

        heroDetail.skills.push({
          name,
          cooldownAttributes: value,
          description: desc,
          tips: tip,
          icon: skillIcons[i] ? `https:${skillIcons[i]}` : "",
        });
      });

      await fs.outputJson(
        path.join(DATA_DIR, `hero/${ename}.json`),
        heroDetail,
        { spaces: 2 },
      );
    } catch (err: any) {
      console.error(
        `Error processing hero detail for ${cname}: ${err.message}`,
      );
    }
  }
}

async function processItems() {
  console.log("Fetching item list...");
  const itemList = await fetchJson(ITEM_LIST_URL);
  await fs.outputJson(path.join(DATA_DIR, "item/list.json"), itemList, {
    spaces: 2,
  });

  for (const item of itemList) {
    const itemId = item.item_id;
    // Try png, then jpg
    const pngUrl = `https://game.gtimg.cn/images/yxzj/img201606/itemimgo/${itemId}.png`;
    const jpgUrl = `https://game.gtimg.cn/images/yxzj/img201606/itemimgo/${itemId}.jpg`;

    let success = await downloadFile(
      pngUrl,
      path.join(DATA_DIR, `item/${itemId}.png`),
    );
    if (!success) {
      console.log(`Retrying with JPG for item ${itemId}`);
      success = await downloadFile(
        jpgUrl,
        path.join(DATA_DIR, `item/${itemId}.jpg`),
      );
    }
  }
}

async function processSummoners() {
  console.log("Fetching summoner list...");
  const summonerList = await fetchJson(SUMMONER_LIST_URL);
  await fs.outputJson(path.join(DATA_DIR, "summoner/list.json"), summonerList, {
    spaces: 2,
  });

  for (const sum of summonerList) {
    const sumId = sum.summoner_id;
    const pngUrl = `https://game.gtimg.cn/images/yxzj/img201606/summonero/${sumId}.png`;
    const jpgUrl = `https://game.gtimg.cn/images/yxzj/img201606/summonero/${sumId}.jpg`;

    let success = await downloadFile(
      pngUrl,
      path.join(DATA_DIR, `summoner/${sumId}.png`),
    );
    if (!success) {
      console.log(`Retrying with JPG for summoner ${sumId}`);
      success = await downloadFile(
        jpgUrl,
        path.join(DATA_DIR, `summoner/${sumId}.jpg`),
      );
    }
  }
}

async function main() {
  try {
    await processHeroes();
    if (!process.argv[2]) {
      await processItems();
      await processSummoners();
    }
    console.log("All done!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
