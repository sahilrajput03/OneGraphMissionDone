/* eslint-disable */
import React, { Component } from "react";
import GraphiQL from "graphiql";
import GraphiQLExplorer from "graphiql-explorer";
import { buildClientSchema, getIntrospectionQuery, parse } from "graphql";

import { makeDefaultArg, getDefaultScalarArgValue } from "./CustomArgs";

import "graphiql/graphiql.css";
import "./App.css";
import { DEFAULT_QUERY } from "./DefaultQueries";

import type { GraphQLSchema } from "graphql";

let retrivedObject = localStorage.getItem("testObject");
let testObject = JSON.parse(retrivedObject);
let urlValue = testObject?.urlValue;

const initialUrl = "https://api.react-finland.fi/graphql";
// const initialUrl = "https://my-graphqlmiddleware.glitch.me/graphql";
// const initialUrl = "https://my-graphqlmiddleware.glitch.me/graphql";

const defaultUrl = urlValue || initialUrl;

console.log("Starting of app=>", urlValue);

function fetcher(params: Object): Object {
  return fetch(defaultUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (responseBody) {
      try {
        return JSON.parse(responseBody);
      } catch (e) {
        return responseBody;
      }
    });
}

type State = {
  schema: ?GraphQLSchema,
  query: string,
  explorerIsOpen: boolean
};

class App extends Component<{}, State> {
  _graphiql: GraphiQL;
  // state = {
  //   schema: null,
  //   explorerIsOpen: true,
  //   query: DEFAULT_QUERY,
  //   customUrl: defaultUrl,
  //   inputTextValue: defaultUrl
  // };
  /* sahil code below */
  constructor(props) {
    super(props);
    this.state = {
      schema: null,
      explorerIsOpen: true,
      query: DEFAULT_QUERY,
      customUrl: defaultUrl,
      inputTextValue: defaultUrl
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleChange(event) {
    this.setState({ inputTextValue: event.target.value });
  }

  handleSubmit(event) {
    let testObject = { urlValue: this.state.inputTextValue };
    // alert(
    //   "Url saved: " +
    //     this.state.inputTextValue +
    //     " Please refresh to get `Explore` show related queries."
    // );/* COMMENTED TEMPORARILY */
    localStorage.setItem("testObject", JSON.stringify(testObject));
    let retrivedObject = localStorage.getItem("testObject");
    let { urlValue } = JSON.parse(retrivedObject);
    console.log("Submitted: testObject.urlValue => ", urlValue);
    document.documentElement.scrollTop = 0;
    window.location.reload(); /* This is magic!! */

    event.preventDefault();
  }
  /* sahil code above */

  componentDidMount() {
    fetcher({
      query: getIntrospectionQuery()
    }).then((result) => {
      const editor = this._graphiql.getQueryEditor();
      editor.setOption("extraKeys", {
        ...(editor.options.extraKeys || {}),
        "Shift-Alt-LeftClick": this._handleInspectOperation
      });
      this.setState({ schema: buildClientSchema(result.data) });
    });
  }

  _handleInspectOperation = (
    cm: any,
    mousePos: { line: Number, ch: Number }
  ) => {
    const parsedQuery = parse(this.state.query || "");

    if (!parsedQuery) {
      console.error("Couldn't parse query document");
      return null;
    }

    var token = cm.getTokenAt(mousePos);
    var start = { line: mousePos.line, ch: token.start };
    var end = { line: mousePos.line, ch: token.end };
    var relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end)
    };

    var position = relevantMousePos;

    var def = parsedQuery.definitions.find((definition) => {
      if (!definition.loc) {
        console.log("Missing location information for definition");
        return false;
      }

      const { start, end } = definition.loc;
      return start <= position.start && end >= position.end;
    });

    if (!def) {
      console.error(
        "Unable to find definition corresponding to mouse position"
      );
      return null;
    }

    var operationKind =
      def.kind === "OperationDefinition"
        ? def.operation
        : def.kind === "FragmentDefinition"
        ? "fragment"
        : "unknown";

    var operationName =
      def.kind === "OperationDefinition" && !!def.name
        ? def.name.value
        : def.kind === "FragmentDefinition" && !!def.name
        ? def.name.value
        : "unknown";

    var selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

    var el = document.querySelector(selector);
    el && el.scrollIntoView();
  };

  _handleEditQuery = (query: string): void => this.setState({ query });

  _handleToggleExplorer = () => {
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };

  render() {
    const { query, schema } = this.state;
    return (
      <div class="mainContainer">
        <div className="websiteTitle">
          <a href="https://abstraction.ml">Abstraction.ml</a>
        </div>
        <h1>Querying Graphql @ <br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{defaultUrl}</h1>
        <strong>Tip: Scroll page, to see options to change graphql endpoint url, or use some public graphql api.</strong>
        <br/>
        <br/>
        <div className="graphiql-container">
          <GraphiQLExplorer
            schema={schema}
            query={query}
            onEdit={this._handleEditQuery}
            onRunOperation={(operationName) =>
              this._graphiql.handleRunQuery(operationName)
            }
            explorerIsOpen={this.state.explorerIsOpen}
            onToggleExplorer={this._handleToggleExplorer}
            getDefaultScalarArgValue={getDefaultScalarArgValue}
            makeDefaultArg={makeDefaultArg}
          />
          <GraphiQL
            ref={(ref) => (this._graphiql = ref)}
            fetcher={fetcher}
            schema={schema}
            query={query}
            onEditQuery={this._handleEditQuery}
          >
            <GraphiQL.Toolbar>
              <GraphiQL.Button
                onClick={() => this._graphiql.handlePrettifyQuery()}
                label="Prettify"
                title="Prettify Query (Shift-Ctrl-P)"
              />
              <GraphiQL.Button
                onClick={() => this._graphiql.handleToggleHistory()}
                label="History"
                title="Show History"
              />
              <GraphiQL.Button
                onClick={this._handleToggleExplorer}
                label="Explorer"
                title="Toggle Explorer"
              />
            </GraphiQL.Toolbar>
          </GraphiQL>
        </div>
        <form onSubmit={this.handleSubmit}>
          <label>
            <h1>Use any Graphql Endpoint Url</h1>
            <input
              className="myGraphqlInputSahil"
              type="text"
              value={this.state.inputTextValue}
              onChange={this.handleChange}
            />
          </label>
          {/* <strong> This button is redundant, coz I can just use `Enter` key submit.
            <input
              class="inputSubmitButton"
              type="submit"
              value="Update graphiql's environment"
            />
          </strong> */}
          <br/>
          <strong>😆Tip: Press `Enter` key to update OneGrahph 😆 </strong>
        </form>
        <button
        className="resetButton"
          onClick={() => {
            localStorage.setItem(
              "testObject",
              JSON.stringify({ urlValue: initialUrl })
            );
            document.documentElement.scrollTop = 0;
            window.location.reload();
          }}
        >
          Reset App
        </button>
        <br/>
        <strong>Tip: To use with your locally running graphQL server, either choose ``http://localhost:5000/graphql`` from the list below or enter your endpoint url manually.</strong>
        <br/>
        <h1>Choose any public graphql api from below -</h1>
        <strong>😇Tip: Click to the url itself, to use it.😇</strong><br/>
        <UsePublicGraphql url="http://localhost:5000/graphql" />
        <UsePublicGraphql url="https://www.graphqlapptest.ml/graphql" />
        <UsePublicGraphql url="https://countries.trevorblades.com/" />
        <UsePublicGraphql url="https://countries-274616.ew.r.appspot.com/" />
        <UsePublicGraphql url="https://api.travelgatex.com/" />
        <UsePublicGraphql url="https://api.react-finland.fi/graphql" />
        <UsePublicGraphql url="https://api.graphql.jobs/" />
        <UsePublicGraphql url="https://etmdb.com/graphql" />
        <UsePublicGraphql url="https://graphbrainz.herokuapp.com/" />
        <UsePublicGraphql url="https://graphql-camara-deputados.herokuapp.com/" />
        <UsePublicGraphql url="https://api.spacex.land/graphql/" />
        <UsePublicGraphql url="https://graphql-compose.herokuapp.com/northwind/" />
        <UsePublicGraphql url="https://directions-graphql.herokuapp.com/graphql" />
        <UsePublicGraphql url="https://rickandmortyapi.com/graphql" />
        <UsePublicGraphql url="https://graphql-weather-api.herokuapp.com/" />
      {/* <UsePublicGraphql url="" /> */}
      <hr/>
      Created by <a href="https://twitter.com/freakstarrocks">Sahil Rajput</a>
      <br/>
      Resources used: <a href="https://github.com/OneGraph/graphiql-explorer-example">One Graph's Client</a>
      
          
  </div>
    );
  }
}

const UsePublicGraphql = ({url}) => {

  return (
    <button class="UsePublicGraphql"
    onClick={() => {
      localStorage.setItem(
        "testObject",
        JSON.stringify({ urlValue: url })
      );
      document.documentElement.scrollTop = 0;/* This is amazing! */
      window.location.reload();
    }}
  >
    {url}
  </button>

  )
}

export default App;
