import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { choicesForStep, reorderAfterMistake } from '../src/logic.mjs';
const stories = JSON.parse(readFileSync(new URL('../public/data/stories.json', import.meta.url)));

test('40 complete stories, 280 unique sentences of 8–10 words, and 120 questions', () => {
  assert.equal(stories.length, 40);
  const sentences = new Set();
  const titles = new Set();
  for (const [index, story] of stories.entries()) {
    assert.equal(story.id, index + 1);
    titles.add(story.title);
    assert.equal(story.steps.length, 7, story.title);
    assert.equal(story.questions.length, 3, story.title);
    for (const step of story.steps) {
      const count = step.sentence.trim().split(/\s+/).length;
      assert.ok(count >= 8 && count <= 10, `${story.id}: ${step.sentence} (${count})`);
      assert.ok(!/\b(mamá|papá)\b/iu.test(step.sentence));
      sentences.add(step.sentence);
      assert.equal(step.viewBox.length, 4);
      assert.ok(step.viewBox[2] > 0 && step.viewBox[3] > 0);
      assert.ok(step.clip.split(' ').length >= 4);
    }
    for (const question of story.questions) {
      assert.equal(question.options.length, 3);
      assert.equal(new Set(question.options).size, 3);
      assert.ok(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < 3);
    }
  }
  assert.equal(sentences.size, 280);
  assert.equal(titles.size, 40);
});

test('every story image and lightweight preview is saved locally', () => {
  for (const story of stories) {
    for (const asset of [story.image, story.preview]) {
      assert.ok(existsSync(new URL(`../public/${asset}`, import.meta.url)), asset);
      assert.ok(!asset.includes('http'));
    }
  }
});

test('every reading step always has three distinct images including its correct scene', () => {
  let seed = 1549;
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let correct = 0; correct < 7; correct++) {
    for (let trial = 0; trial < 100; trial++) {
      let choices = choicesForStep(correct, 7, rng);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices).size, 3);
      assert.ok(choices.includes(correct));
      for (let retry = 0; retry < 12; retry++) {
        const next = reorderAfterMistake(choices, rng);
        assert.deepEqual([...next].sort(), [...choices].sort());
        assert.ok(next.includes(correct));
        assert.ok(next.every((scene, position) => scene !== choices[position]));
        choices = next;
      }
    }
  }
});
