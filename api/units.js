export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const BOARD_ID = '5088115697';
  const TOKEN = process.env.MONDAY_API_TOKEN;

  const query = `{
    boards(ids: ${BOARD_ID}) {
      items_page(limit: 100) {
        items {
          id
          name
          column_values(ids: [
            "color_mm27chzm",
            "numeric_mkzgbed3",
            "numeric_mkzh5w7b",
            "dropdown_mm0v4ghw",
            "dropdown_mm0vynpz",
            "text_mkzmhewt",
            "numeric_mkzgkq2v",
            "link_mkzgjgh3",
            "link_mkzgbc3f",
            "color_mkzgy5pt",
            "color_mm0t3ttz",
            "color_mkzgqssa",
            "text_mm35ajak"
          ]) {
            id
            text
            value
          }
        }
      }
    }
  }`;

  try {
    const apiRes = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TOKEN,
        'API-Version': '2024-01'
      },
      body: JSON.stringify({ query })
    });
    const data = await apiRes.json();
    const allItems = data.data.boards[0].items_page.items;
    const vacantUnits = allItems
      .filter(item => {
        const occupancy = item.column_values.find(c => c.id === 'color_mm27chzm');
        return occupancy && occupancy.text === 'Vacant';
      })
      .map(item => {
        const get = (id) => {
          const col = item.column_values.find(c => c.id === id);
          return col ? col.text : '';
        };
        const getLink = (id) => {
          const col = item.column_values.find(c => c.id === id);
          if (!col || !col.value) return '';
          try { return JSON.parse(col.value).url || ''; } catch(e) { return col.text || ''; }
        };
        return {
          id: item.id,
          name: item.name,
          rent: get('numeric_mkzgbed3'),
          utilities: get('numeric_mkzh5w7b'),
          beds: get('dropdown_mm0v4ghw'),
          baths: get('dropdown_mm0vynpz'),
          notes: get('text_mkzmhewt'),
          sqft: get('numeric_mkzgkq2v'),
          photos: getLink('link_mkzgjgh3'),
          video: getLink('link_mkzgbc3f'),
          type: get('color_mkzgy5pt'),
          listingType: get('color_mm0t3ttz'),
          laundry: get('color_mkzgqssa'),
          renovation: get('text_mm35ajak')
        };
      });
    res.status(200).json({ units: vacantUnits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
