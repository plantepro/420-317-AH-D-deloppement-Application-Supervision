/**
 * Construction des options de requete a partir de req.query.
 *
 * Ces fonctions sont PURES : elles ne touchent ni a Express, ni a Mongoose.
 * C'est ce qui permet de les tester sans serveur et sans base (npm test).
 */

// Seuls ces champs peuvent etre tries. Tout le reste retombe sur le defaut.
const SORTABLE_FIELDS = ["createdAt", "value"];//白名单whitelist：只允许这两个字段进行排序，其他字段使用默认排序

/**
 * On lit les parametres attendus UN PAR UN.
 * Jamais Measure.find(req.query) : le client choisirait lui-meme les
 * operateurs de la requete, ce qui est une injection.
 */
export function buildFilter(query) { //构建过滤器对象
  const filter = {}; //初始化过滤器对象

  if (query.sensor) {
    filter.sensor = query.sensor; //如果query中有sensor参数，就把它加入过滤器对象
  }

  // Tout ce qui vient de l'URL est du TEXTE : sans Number(), la comparaison
  // porte sur des chaines et renvoie des resultats faux, sans erreur.
  const min = query.min === undefined ? undefined : Number(query.min); //如果query中有min参数，就把它转换为数字类型，否则为undefined
  const max = query.max === undefined ? undefined : Number(query.max); //如果query中有max参数，就把它转换为数字类型，否则为undefined

  if (Number.isFinite(min) || Number.isFinite(max)) { //如果min或max是有限数字，就把它们加入过滤器对象
    filter.value = {}; //初始化value过滤器对象
    if (Number.isFinite(min)) filter.value.$gte = min; //如果min是有限数字，就把它加入value过滤器对象，表示大于等于min
    if (Number.isFinite(max)) filter.value.$lte = max; //如果max是有限数字，就把它加入value过滤器对象，表示小于等于max
  }

  const from = query.from === undefined ? undefined : new Date(query.from); //如果query中有from参数，就把它转换为日期类型，否则为undefined
  const to = query.to === undefined ? undefined : new Date(query.to); //如果query中有to参数，就把它转换为日期类型，否则为undefined

  const fromValide = from instanceof Date && !Number.isNaN(from.valueOf()); //如果from是日期类型且不是NaN，就为true，否则为false
  const toValide = to instanceof Date && !Number.isNaN(to.valueOf()); //如果to是日期类型且不是NaN，就为true，否则为false

  if (fromValide || toValide) { //如果from或to是有效日期，就把它们加入过滤器对象
    filter.createdAt = {}; //初始化createdAt过滤器对象
    if (fromValide) filter.createdAt.$gte = from; //如果from是有效日期，就把它加入createdAt过滤器对象，表示大于等于from
    if (toValide) filter.createdAt.$lte = to; //如果to是有效日期，就把它加入createdAt过滤器对象，表示小于等于to
  }

  return filter;
}

/**
 * Liste blanche : on n'accepte pas n'importe quel nom de champ venant du client.
 * Defaut : la mesure la plus recente en premier.
 */
export function buildSort(query) {
  const field = SORTABLE_FIELDS.includes(query.sort) ? query.sort : "createdAt"; //如果query中有sort参数且在SORTABLE_FIELDS中，就用它，否则用createdAt
  const direction = query.order === "asc" ? 1 : -1;  //如果query中有order参数且为asc，就用1，否则用-1，表示降序

  return { [field]: direction }; //返回一个对象，键为field，值为direction
}

// Plafond dur : sans lui, un client ecrit ?limit=999999 et le probleme
// que la pagination devait resoudre revient intact.
const LIMIT_DEFAUT = 20;
const LIMIT_MAX = 100;

export function buildPagination(query) {
  const pageDemandee = Number(query.page); //如果query中有page参数，就把它转换为数字类型，否则为NaN
  const limitDemandee = Number(query.limit);//如果query中有limit参数，就把它转换为数字类型，否则为NaN

  const page = Number.isInteger(pageDemandee) && pageDemandee > 0 ? pageDemandee : 1; //如果pageDemandee是整数且大于0，就用它，否则用1

  const limit = Number.isInteger(limitDemandee) && limitDemandee > 0
    ? Math.min(limitDemandee, LIMIT_MAX) //如果limitDemandee是整数且大于0，就用它和LIMIT_MAX中的最小值，否则用LIMIT_DEFAUT
    : LIMIT_DEFAUT;

  return { page, limit, skip: (page - 1) * limit };//返回一个对象，包含page, limit和skip，skip为跳过的文档数，用于分页查询
}

export function buildPaginationMeta({ page, limit, total }) {
  return { page, limit, total, pages: Math.ceil(total / limit) }; //返回一个对象，包含page, limit, total和pages，pages为总页数，向上取整
}
