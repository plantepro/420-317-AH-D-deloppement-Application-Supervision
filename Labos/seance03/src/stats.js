/**
 * Calcule les statistiques d'un tableau de mesures.
 * Cette fonction sera exposee par une route HTTP a la seance 3.
 */
export function computeStats(measures) { // 计算测量值的统计信息。这个函数将在第3节通过HTTP路由公开。
  if (measures.length === 0) { 
    return { count: 0, min: null, max: null, average: null };
  }

  const values = measures.map((measure) => measure.value); //提取测量值的数组

  return {
    count: values.length,
    min: Math.min(...values), //计算最小值 ...values 是展开运算符，将数组展开为单独的参数传递给 Math.min() 和 Math.max()
    max: Math.max(...values),
    average: Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2)), //计算平均值，保留两位小数 reduce() 方法将数组中的所有元素累加起来，初始值为 0，然后除以数组长度，最后使用 toFixed(2) 保留两位小数，并使用 Number() 将字符串转换为数字
  };
}
