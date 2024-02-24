// 导入必要的模组
const got = require('@/utils/got'); // 自订的 got
const cheerio = require('cheerio'); // 可以使用类似 jQuery 的 API HTML 解析器
// const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    // 在此处编写您的逻辑
    // 从 URL 参数中获取用户名和仓库名称
    // const { type, } = ctx.params;
    const baseUrl = 'https://jwc.upc.edu.cn';
    const { data: response } = await got(`https://jwc.upc.edu.cn/tzgg/list.htm`);
    // console.log(response);
    const $ = cheerio.load(response);
    // const listItems = $('ul.news_list').find('li');
    // console.log(`List item count: ${listItems.length}`);
    // const list = $('ul.news_list')  只会得到第一个li
    const list = $('ul.news_list')
        .find('li')
        // 使用“toArray()”方法将选择的所有 DOM 元素以数组的形式返回。
        .toArray()
        // 使用“map()”方法遍历数组，并从每个元素中解析需要的数据。
        .map((item) => {
            // console.log(item);
            item = $(item);
            const a = item.find('a').first();
            // console.log(a.text());
            return {
                title: a.text(),
                // `link` 需要一个绝对 URL，但 `a.attr('href')` 返回一个相对 URL。
                link: `${baseUrl}${a.attr('href')}`,

                // pubDate: parseDate(item.find('relative-time').attr('datetime')),
            };
        });
    // console.log(list);

    const items = await Promise.all(
        list.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);

                // 选择类名为“comment-body”的第一个元素
                item.description = $('.read').first().html();
                item.pubDate = $('.arti_update').html();
                item.publisher = $('.arti_publisher').html();
                // 上面每个列表项的每个属性都在此重用，
                // 并增加了一个新属性“description”
                return item;
            })
        )
    );

    ctx.state.data = {
        // 源标题
        title: `issues`,
        // 源链接
        link: `https://jwc.upc.edu.cn/tzgg/list.htm`,
        // 源文章
        item: items,
    };
};
