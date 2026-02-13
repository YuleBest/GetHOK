# 王者荣耀战斗查询 API 笔记

## 英雄

### 英雄列表和头像

王者荣耀官网英雄页：https://pvp.qq.com/web201605/herolist.shtml ，经过源代码分析可以发现，英雄列表是一个 JSON 文件，URL 是 https://pvp.qq.com/web201605/js/herolist.json。JSON 格式如下：

```json
[
  {
    "ename": 105,
    "cname": "廉颇",
    "id_name": "lianpo",
    "title": "正义爆轰",
    "new_type": 0,
    "hero_type": 3,
    "skin_name": "正义爆轰|地狱岩魂|无尽征程|寅虎·御盾|功夫炙烤|撼地雄心",
    "moss_id": 3627
  },
  {
    "ename": 106,
    "cname": "小乔",
    "id_name": "xiaoqiao",
    "title": "恋之微风",
    "new_type": 0,
    "hero_type": 2,
    "skin_name": "恋之微风|万圣前夜|天鹅之梦|纯白花嫁|缤纷独角兽|丁香结|青蛇|音你心动|山海·琳琅生|时之魔女|秘证寻踪",
    "moss_id": 3644
  }
  // ...
]
```

获取英雄列表后，使用 `https://game.gtimg.cn/images/yxzj/img201606/heroimg/[ename]/[ename].jpg` 可以获取英雄的头像。

### 英雄详情

然后是获取英雄详情，这是最难的部分：

1. `https://pvp.qq.com/web201605/herodetail/m/[id_name].html` 是英雄详情页

2. 使用移动端 UA，爬取此页面源代码。注意：页面编码可能为 GBK。

3. 英雄介绍、职业等信息位于 `/html/body/div[1]/div[2]/div` 下，此处有 3 个 `p class` 以及 1 个 `div class`，它们的顺序是固定的，这让我们可以进行解析：

```html
<div class="hero-attribute">
  <!-- 英雄称号和名称 -->
  <p class="hero-title">追忆之刃</p>
  <p class="hero-name">亚连</p>
  <!-- 英雄职业 -->
  <p class="hero-location" data-herotype="1/">游戏职业：战士</p>
  <!-- 英雄属性 -->
  <div class="hero-cover">
    <ul class="cover-list c">
      <li>
        生存
        <!-- “生存”属性点为 6（hero-attr1-**6**） -->
        <span class="cnver1 hero-attrsp hero-attr1-6"></span>
      </li>
      <li>
        攻击
        <span class="cnver2 hero-attrsp hero-attr2-8"></span>
      </li>
      <li>
        技能
        <span class="cnver3 hero-attrsp hero-attr3-4"></span>
      </li>
      <li>
        难度
        <span class="cnver4 hero-attrsp hero-attr4-2"></span>
      </li>
    </ul>
    <a
      href="/m/m201706/herodetail/newskin.shtml?id=514"
      class="hero-skin"
      data-imgname="追忆之刃&amp;0|破局者&amp;1|落雪白狼&amp;5|破空之剑&amp;132|糖绘人间&amp;12"
      data-name="亚连"
      >皮肤：5</a
    >
  </div>
</div>
```

4. 英雄技能图标位于 `/html/body/div[1]/div[3]/div/div[1]/div[2]/div/ul[1]` 下面：

```html
<ul class="plus-tab c controller">
  <li
    onclick='pgvSendClick({hottag:"cp.a20170620wzrs.raiders.plustab.list1"});'
    class="current"
  >
    <img
      src="//game.gtimg.cn/images/yxzj/img201606/heroimg/514/51400.png"
      alt=""
    />
  </li>
  <li
    onclick='pgvSendClick({hottag:"cp.a20170620wzrs.raiders.plustab.list2"});'
  >
    <img
      src="//game.gtimg.cn/images/yxzj/img201606/heroimg/514/51410.png"
      alt=""
    />
  </li>
  <li
    onclick='pgvSendClick({hottag:"cp.a20170620wzrs.raiders.plustab.list3"});'
  >
    <img
      src="//game.gtimg.cn/images/yxzj/img201606/heroimg/514/51420.png"
      alt=""
    />
  </li>
  <li
    onclick='pgvSendClick({hottag:"cp.a20170620wzrs.raiders.plustab.list4"});'
  >
    <img
      src="//game.gtimg.cn/images/yxzj/img201606/heroimg/514/51430.png"
      alt=""
    />
  </li>
</ul>
```

5. 英雄技能信息位于 `/html/body/div[1]/div[3]/div/div[1]/div[2]/div/ul[2]` 下面：

```html
<ul class="plus-content content">
  <li
    class="current"
    style="display: list-item; transform-origin: 0px 0px; opacity: 1; transform: scale(1, 1);"
  >
    <div class="plus-box c">
      <span class="plus-name" data-skillid="51400">剑啸</span>
      <span class="plus-value">(冷却值：0 消耗：0)</span>
    </div>
    <p class="plus-int">
      亚连普攻速度极快，每次会使用双剑赤影和守心攻击两次，造成22~44(随等级成长)(+30%物理攻击)法术伤害和22~44(随等级成长)(+30%物理攻击)物理伤害，第一次攻击会追踪目标，第三次攻击会同时挥动双剑，造成33~66(随等级成长)(+45%物理攻击)真实伤害，之后会进入较长的攻击间隔。普攻和技能命中敌方英雄时积攒怒气，最大提高自身40%物理、法术穿透以及20%免伤，怒气积累满时一次性回复200~400(随等级成长)(+3%额外生命值)生命(血量越低回复越高，最高获得3倍回复)，冷却8秒。<br />亚连的物理吸血享受75%效果，并作用于法术和真实伤害。亚连普攻只造成60%的法球效果。
    </p>
    <p class="prompt">
      小提示：怒气叠满时会瞬间回复一口血，叠满被动很容易丝血反杀敌人
    </p>
  </li>
  <li style="display: none;">
    <div class="plus-box c">
      <span class="plus-name" data-skillid="51410">流星斩</span>
      <span class="plus-value">(冷却值：5/4.8/4.6/4.4/4.2/4 消耗：0)</span>
    </div>
    <p class="plus-int">
      亚连发起上挑，对前方目标造成85/102/119/136/153/170(+37%物理攻击)法术伤害和两次85/102/119/136/153/170(+37%物理攻击)物理伤害并击飞正前方目标0.75秒，然后根据自身印记数进行追加攻击。<br />一层：追加一次85/102/119/136/153/170(+37%物理攻击)法术伤害和一次85/102/119/136/153/170(+37%物理攻击)物理伤害。<br />二层：扩大击飞范围，额外再追加一次85/102/119/136/153/170(+37%物理攻击)法术伤害和一次85/102/119/136/153/170(+37%物理攻击)物理伤害，可以缓慢移动释放。<br />三层：扩大击飞范围，额外再追加85/102/119/136/153/170(+37%物理攻击)真实伤害和170/204/238/272/306/340(+75%物理攻击)真实伤害，可以缓慢移动释放并获得霸体。<br />印记层数可通过普攻和三技能命中获取。流星斩可以触发50%普攻法球效果并可暴击吸血。
    </p>
    <p class="prompt">
      小提示：当敌人逃离1技能攻击范围时，可以通过2技能和3技能打断1技能释放
    </p>
  </li>
  <li style="display: none;">
    <div class="plus-box c">
      <span class="plus-name" data-skillid="51420">逐月闪</span>
      <span class="plus-value">(冷却值：2 消耗：0)</span>
    </div>
    <p class="plus-int">
      亚连朝指定方向突进，对路径上的敌人造成100/120/140/160/180/200(+25%物理攻击)物理伤害和法术伤害并减少15/18/21/24/27/30%移速，持续3秒，下3次普攻获得额外40/48/56/64/72/80%攻速。<br />每10秒可准备1次【逐月闪】(受冷却影响)，最多可储备2次【逐月闪】。
    </p>
    <p class="prompt">小提示：使用后会获得额外攻速， 便于快速叠出强化1技能</p>
  </li>
  <li style="display: none;">
    <div class="plus-box c">
      <span class="plus-name" data-skillid="51430">落日斩</span>
      <span class="plus-value">(冷却值：45/40/35 消耗：0)</span>
    </div>
    <p class="plus-int">
      亚连选定目标英雄跃向天空，不可选中，持续1.5秒，期间可以移动，随后猛击大地对敌方英雄造成175/250/325(+45%物理攻击)物理伤害和法术伤害，越靠近亚连受到的伤害越高，最多提高100%。每命中一个敌方英雄，亚连都会获得印记层数和怒气。<br />亚连会基于选取目标阵营来造成相应的效果，下落时为友方目标/自身增加640/960/1280(+8%额外生命值)护盾，每额外命中一个敌方英雄护盾值提高1/3。
    </p>
    <p class="prompt">
      小提示：使用后会进入一段无法选中时间，可以用来躲避关键技能；
      落地后若命中敌方，会积攒1技能层数，可以更快的使用强化1技能；释放后，尽量靠近敌人，可以打出最大伤害
    </p>
  </li>
</ul>
```

## 装备

URL: https://pvp.qq.com/web201605/js/item.json

```json
[{
	"item_id": 1111,
	"item_name": "铁剑",
	"item_type": 1,
	"price": 165,
	"total_price": 275,
	"des1": "<p>+20物理攻击</p>"
}, {
	"item_id": 1112,
	"item_name": "匕首",
	"item_type": 1,
	"price": 180,
	"total_price": 300,
	"des1": "<p>+10%攻击速度 </p>"
}, {
	"item_id": 1113,
	"item_name": "搏击拳套",
	"item_type": 1,
	"price": 180,
	"total_price": 300,
	"des1": "<p>+8%暴击率 </p>"
},
// ...
```

装备图标：`https://game.gtimg.cn/images/yxzj/img201606/itemimgo/[item_id].png`，大部分是 png，小部分是 jpg，png 请求失败时需要进行回退。

## 召唤师技能

URL: https://pvp.qq.com/web201605/js/summoner.json

```json
[{
	"summoner_id": 80104,
	"summoner_name": "惩击",
	"summoner_rank": "LV.1解锁",
	"summoner_description": "30秒CD：对身边的野怪和小兵造成真1500点的实伤害并眩晕1秒"
}, {
	"summoner_id": 80108,
	"summoner_name": "终结",
	"summoner_rank": "LV.3解锁",
	"summoner_description": "60秒CD：立即对身边敌军英雄造成其已损失生命值16%的真实伤害，如果成功击败敌人则减少90%的冷却时间"
}, {
	"summoner_id": 80110,
	"summoner_name": "狂暴",
	"summoner_rank": "LV.5解锁",
	"summoner_description": "75秒CD：使用期间增加10%伤害、增加25%韧性、20%的物理吸血和30%法术吸血，持续7秒"
}, {
	"summoner_id": 80109,
	"summoner_name": "疾跑",
	"summoner_rank": "LV.7解锁",
	"summoner_description": "75秒CD：增加30%移动速度持续10秒，开启时移除自身的减速效果，且疾跑期间减少50%受到的减速效果，脱战时额外增加20%的移速"
},
// ...
```

召唤师技能图标: `https://game.gtimg.cn/images/yxzj/img201606/summonero/[summoner_id].png`，大部分是 png，小部分是 jpg，png 请求失败时需要进行回退。
