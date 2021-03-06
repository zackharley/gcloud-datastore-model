'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const dataset = require('./test_dataset');

describe('GCloud Datastore Model Events', () => {
  let sandbox;
  let TestModel;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(dataset, 'get', (key, callback) =>
      callback(null, {key, data: {_metadata: {}}}));

    sandbox.stub(dataset, 'delete', (key, callback) => {
      if (key.path[0] === 'Error') {
        return callback(new Error());
      }

      callback(null, {mutation_result: {index_updates: 1}});
    });

    sandbox.stub(dataset, 'save', (entity, callback) =>
      callback(entity.key.path[0] === 'Error' ? new Error() : null));

    TestModel = require('../')(dataset);
  });

  afterEach(() => sandbox.restore());

  describe('inserted', () => {
    let onInsertedEventSpy;
    let insertedModel;

    beforeEach(() => {
      onInsertedEventSpy = sandbox.spy();
      TestModel.on('inserted', onInsertedEventSpy);
    });

    describe('when insert succeeds', () => {
      const key = dataset.key('Thing', '1');

      beforeEach(() =>
        TestModel.insert(key, {test: 'value'}).then(model => insertedModel = model));

      it('raises the event', () => {
        sinon.assert.calledOnce(onInsertedEventSpy);
      });

      it('sends two arguments', () => {
        expect(onInsertedEventSpy.firstCall.args).to.have.length(2);
      });

      it('sends the model as the first event argument', () => {
        expect(onInsertedEventSpy.firstCall.args[0]).to.deep.equal(insertedModel);
      });

      it('sends the key as the second event argument', () => {
        expect(onInsertedEventSpy.firstCall.args[1]).to.deep.equal(key);
      });
    });

    describe('when insert errors', () => {
      beforeEach(() =>
        TestModel.insert(dataset.key('Error', '1'), {test: 'value'})
          .catch(() => null));

      it('does not raise the event', () => {
        sinon.assert.notCalled(onInsertedEventSpy);
      });
    });
  });

  describe('updated', () => {
    let onUpdatedEventSpy;
    let updatedModel;

    beforeEach(() => {
      onUpdatedEventSpy = sandbox.spy();
      TestModel.on('updated', onUpdatedEventSpy);
    });

    describe('when update succeeds', () => {
      const key = dataset.key('Thing', '1');

      beforeEach(() =>
        TestModel.update(key, {test: 'value'}).then(model => updatedModel = model));

      it('raises the event', () => {
        sinon.assert.calledOnce(onUpdatedEventSpy);
      });

      it('sends two arguments', () => {
        expect(onUpdatedEventSpy.firstCall.args).to.have.length(2);
      });

      it('sends the model as the first event argument', () => {
        expect(onUpdatedEventSpy.firstCall.args[0]).to.deep.equal(updatedModel);
      });

      it('sends the key as the second event argument', () => {
        expect(onUpdatedEventSpy.firstCall.args[1]).to.deep.equal(key);
      });
    });

    describe('when update errors', () => {
      beforeEach(() =>
        TestModel.update(dataset.key('Error', '1'), {test: 'value'})
          .catch(() => null));

      it('does not raise the event', () => {
        sinon.assert.notCalled(onUpdatedEventSpy);
      });
    });
  });

  describe('deleted', () => {
    let onDeletedEventSpy;

    beforeEach(() => {
      onDeletedEventSpy = sandbox.spy();
      TestModel.on('deleted', onDeletedEventSpy);
    });

    describe('when delete succeeds', () => {
      const key = dataset.key('Thing', '1');

      beforeEach(() =>
        TestModel.delete(key));

      it('raises the event', () => {
        sinon.assert.calledOnce(onDeletedEventSpy);
      });

      it('sends the key as the only event argument', () => {
        expect(onDeletedEventSpy.firstCall.args).to.deep.equal([key]);
      });
    });

    describe('when delete errors', () => {
      beforeEach(() =>
        TestModel.delete(dataset.key('Error', '1'))
          .catch(() => null));

      it('does not raise the event', () => {
        sinon.assert.notCalled(onDeletedEventSpy);
      });
    });
  });
});
