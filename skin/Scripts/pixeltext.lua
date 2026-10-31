-- Lays out a string from pre-rendered glyph images into a row of Image meters
-- named <prefix>1 .. <prefix><slots>. Positions follow the font's advances and kerning
-- and snap to whole cells, the same way the design's canvas does.
local M = {}
M.__index = M

local function round(v) return math.floor(v + 0.5) end
M.round = round

-- o = { prefix=, slots=, glyphs= (table from glyphs_*.lua), dir= (folder with <code>.png), cell= }
function M.new(o)
  o.last = nil
  o.width = 0
  return setmetatable(o, M)
end

-- Draws text with its pen starting at design-pixel x0. Returns the advance width in design pixels.
function M:draw(text, x0)
  if text == self.last then return self.width end
  self.last = text
  local g, pen, prev, slot = self.glyphs, x0, nil, 0
  for i = 1, #text do
    local b = text:byte(i)
    if g.adv[b] then
      if prev then pen = pen + (g.kern[prev * 256 + b] or 0) end
      if b ~= 32 and slot < self.slots then
        slot = slot + 1
        local m = self.prefix .. slot
        SKIN:Bang('!SetOption', m, 'ImageName', self.dir .. b .. '.png')
        SKIN:Bang('!SetOption', m, 'X', tostring((round(pen) - g.pad) * self.cell))
        SKIN:Bang('!ShowMeter', m)
      end
      pen = pen + g.adv[b]
      prev = b
    end
  end
  for k = slot + 1, self.slots do SKIN:Bang('!HideMeter', self.prefix .. k) end
  self.width = pen - x0
  return self.width
end

return M
