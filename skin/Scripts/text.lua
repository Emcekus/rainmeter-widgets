-- Text widget: draws the Text variable (from Text.inc) and sizes the drag area to fit.
local PT, txt, cell, shownW

function Initialize()
  local res = SKIN:GetVariable('@')
  PT = dofile(res .. 'Scripts\\pixeltext.lua')
  cell = tonumber(SKIN:GetVariable('Cell'))
  txt = PT.new{ prefix = 'MeterChar', slots = 24, cell = cell,
                glyphs = dofile(res .. 'Scripts\\glyphs_text.lua'), dir = res .. 'Images\\Text\\glyph\\' }
end

function Update()
  local s = (SKIN:GetVariable('Text') or ''):sub(1, 24)
  local w = txt:draw(s, 2)
  local cols = math.max(30, math.ceil(w) + 6)            -- same sizing as the design
  local hitW = math.max(cols * cell, tonumber(SKIN:GetVariable('MinWidth')))
  if hitW ~= shownW then
    SKIN:Bang('!SetOption', 'MeterHit', 'W', tostring(hitW))
    shownW = hitW
  end
  return w
end
